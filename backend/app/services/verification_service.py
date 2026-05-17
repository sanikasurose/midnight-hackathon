from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.job import Job
from app.models.proof import Proof


class VerificationService:
    @classmethod
    def verify_application(
        cls,
        *,
        job_id: str,
        candidate_id: int,
        proof_ids: list[str],
        db: Session,
    ) -> dict:
        # Fetch Job
        job = db.execute(select(Job).where(Job.id == int(job_id))).scalar_one_or_none()
        if not job:
            return {"error": f"Job {job_id} not found"}

        # Fetch proofs
        proofs: list[Proof] = []
        for pid in proof_ids:
            proof = None
            try:
                proof = db.execute(select(Proof).where(Proof.id == int(pid))).scalar_one_or_none()
            except ValueError:
                pass

            if not proof:
                proof = db.execute(select(Proof).where(Proof.proof_hash == pid)).scalar_one_or_none()

            if proof:
                proofs.append(proof)

        # Requirements checklist
        requirements = job.requirements or {}
        requirements_count = len(requirements)

        requirement_status = []
        all_satisfied = True

        for req_type, req_details in requirements.items():
            # Find a proof that matches req_type and is verified
            matching_proof = None
            for p in proofs:
                if p.proof_type.upper() == req_type.upper() and p.verified:
                    matching_proof = p
                    break

            satisfied = False
            if matching_proof:
                req_val = req_details.get("value")
                operator = req_details.get("operator", ">=")
                proof_threshold = matching_proof.public_inputs.get("threshold")

                if proof_threshold is not None and req_val is not None:
                    try:
                        pt = float(proof_threshold)
                        rv = float(req_val)
                        if operator == ">":
                            satisfied = pt > rv
                        elif operator == ">=":
                            satisfied = pt >= rv
                        elif operator == "<":
                            satisfied = pt < rv
                        elif operator == "<=":
                            satisfied = pt <= rv
                        elif operator == "==":
                            satisfied = pt == rv
                        else:
                            satisfied = pt >= rv
                    except ValueError:
                        satisfied = True
                else:
                    satisfied = True

            if not satisfied:
                all_satisfied = False

            requirement_status.append({
                "requirement_type": req_type,
                "satisfied": satisfied,
            })

        if requirements_count == 0:
            all_satisfied = True

        # Store application in DB
        app_proof_str = ",".join(proof_ids) if proof_ids else ""
        application = Application(
            job_id=int(job_id),
            candidate_id=int(candidate_id),
            proof_id=app_proof_str,
            verification_status="VERIFIED" if all_satisfied else "FAILED",
            ai_report={},
        )
        db.add(application)
        db.commit()
        db.refresh(application)

        return {
            "application_id": f"app_{application.id}",
            "verified": all_satisfied,
            "timestamp": datetime.utcnow().isoformat(),
            "details": {
                "requirements_count": requirements_count,
                "proofs_provided": len(proofs),
                "all_satisfied": all_satisfied,
                "requirement_status": requirement_status,
            },
        }
