# VeriHire Smart Contract

Midnight Compact contract for privacy-preserving credential verification and zero-knowledge proof management.

## Overview

VeriHire enables employers to verify candidate qualifications (GPA, experience, etc.) **without ever seeing the actual values**. All credentials are stored as hashes, and proofs confirm statements like "GPA > 3.5" without revealing the actual GPA.

## Contract Architecture

### Data Structures

```typescript
// Credential entry: stores metadata for a hashed credential without revealing data
export struct CredentialEntry {
  owner: Bytes<32>,           // wallet address that owns this credential
  timestamp: Bytes<32>,       // when stored (for audit trails)
  isActive: Boolean,          // whether credential is still valid
}

// Proof record: stores verification result for a single proof
export struct ProofRecord {
  credentialHash: Bytes<32>,  // links proof to a credential
  proofType: Field,           // 1 = GPA, 2 = Experience, 3 = Degree, etc.
  isValid: Boolean,           // TRUE if proof verified, FALSE otherwise
  timestamp: Bytes<32>,       // when proof was verified
}

// Job requirement: defines what a job asks for
export struct Requirement {
  requirementType: Field,     // 1 = GPA, 2 = Experience, etc.
  operator: Field,            // 1 = >, 2 = >=, 3 = ==, etc.
  value: Field,               // threshold/target value
}

// Application record: minimal recording of verification result
export struct ApplicationRecord {
  jobId: Bytes<32>,           // identifies the job
  candidateId: Bytes<32>,     // wallet address of candidate
  verificationResult: Boolean, // VERIFIED = TRUE, FAILED = FALSE
  timestamp: Bytes<32>,       // when application was submitted
}
```

### Ledger State (On-Chain Storage)

```
credentialRegistry: Map<Hash → {owner, timestamp, isActive}>
proofRegistry: Map<ProofHash → {proofType, isValid, timestamp}>
applicationRegistry: Map<AppHash → {jobId, candidateId, result, timestamp}>
proofCounter: Counter (for audit trail)
```

### Key Principle: ZERO Raw Data

❌ **Never stored on-chain:**
- GPA values (3.72)
- Names, emails
- Transcripts, certificates
- Proof details

✅ **Always stored:**
- Credential hashes (hash of data)
- Boolean verification results
- Timestamps (for audit)
- Owner information (wallet address)

---

## Circuits (Functions)

### 1. `store_credential(credentialHash)`

**Purpose:** Register a credential hash on-chain

**Input:**
```typescript
credentialHash: Bytes<32>  // SHA256(GPA) or SHA256(credential data)
```

**Output:**
```typescript
// Transaction hash (implicit, returned by Midnight SDK)
// On-chain: credentialRegistry[hash] = {owner, timestamp, isActive=true}
```

**Behavior:**
- Maps credential hash to owner (wallet calling the circuit)
- Records timestamp
- Prevents duplicates (second registration fails)

**Example:**
```
Candidate's off-chain GPA = 3.72
hash = SHA256(3.72) = 0xABC123...
store_credential(0xABC123...)
→ Stored on-chain: {
    owner: 0x...[candidate wallet],
    timestamp: 1715873400,
    isActive: true
  }
```

---

### 2. `verify_gpa_proof(credentialHash, proofHash, threshold)`

**Purpose:** Verify ZK proof that "GPA > threshold"

**Input:**
```typescript
credentialHash: Bytes<32>  // which credential this proof relates to
proofHash: Bytes<32>       // unique identifier for this proof
threshold: Field           // GPA must exceed this (3500 = 3.5)
```

**Output:**
```typescript
// On-chain: proofRegistry[proofHash] = {
//   credentialHash,
//   proofType: 1 (GPA),
//   isValid: true/false,
//   timestamp
// }
```

**Behavior:**
- Calls `fetch_gpa_value()` witness (off-chain) to get actual GPA
- Compares GPA > threshold
- Stores result **without revealing GPA value**
- Increments proof counter (audit trail)

**Example:**
```
Candidate's GPA = 3.72, Threshold = 3.5
verify_gpa_proof(credentialHash, proofHash, 3500)
→ On-chain: {
    credentialHash: 0xABC123...,
    proofType: 1,
    isValid: true,        // because 3.72 > 3.5
    timestamp: 1715873410
  }
```

---

### 3. `verify_job_requirements(proofHash1, proofHash2, reqType1, reqType2)`

**Purpose:** Check if all job requirements are satisfied

**Input:**
```typescript
proofHash1: Bytes<32>      // first proof
proofHash2: Bytes<32>      // second proof (optional)
requiredType1: Field       // requirement type (1=GPA, 2=Experience, etc.)
requiredType2: Field       // another requirement
```

**Output:**
```typescript
Boolean  // TRUE if ALL requirements pass, FALSE if ANY fails
```

**Behavior:**
- Looks up both proofs in registry
- Checks proof type matches requirement type
- Checks proof verification status (isValid)
- Returns TRUE **only if all match and all are valid**

**Example:**
```
Job Requirements:
  - GPA > 3.5 (type=1, operator=>, value=3.5)
  - 2+ years experience (type=2, operator=>=, value=2)

Proofs submitted:
  - proofHash1: GPA verified as TRUE
  - proofHash2: Experience verified as FALSE (only 1 year)

verify_job_requirements(proofHash1, proofHash2, 1, 2)
→ FALSE  (because experience proof failed)

Employer sees: { verified: false }
WITHOUT seeing: actual GPA, actual experience
```

---

### 4. `submit_application(jobId, candidateId, verificationResult)`

**Purpose:** Record application submission (minimal audit trail)

**Input:**
```typescript
jobId: Bytes<32>            // identifies the job
candidateId: Bytes<32>      // wallet of candidate
verificationResult: Boolean // TRUE = verified, FALSE = failed
```

**Output:**
```typescript
// On-chain: applicationRegistry[appId] = {
//   jobId,
//   candidateId,
//   verificationResult,
//   timestamp
// }
```

**Behavior:**
- Records application with result (no personal data)
- Timestamps for audit trail
- Does NOT store proof details or credentials

**Privacy Guarantee:**
Employer cannot see:
- GPA value ✓
- Years of experience ✓
- School name ✓
- Any credential details ✓

Employer only sees:
- Application submitted ✓
- Verified: true/false ✓

---

### 5. `check_credential_status(credentialHash)`

**Purpose:** Verify credential is registered and active

**Input:**
```typescript
credentialHash: Bytes<32>  // credential to check
```

**Output:**
```typescript
Boolean  // TRUE if active, FALSE if not found/inactive
```

**Behavior:**
- Reads credentialRegistry (no modification)
- Returns activation status
- Used for validation before proof generation

---

## Data Flow Example (Full Scenario)

### Scenario: VeriHire Application Process

**Timeline:**

1. **Candidate uploads resume** (off-chain)
   ```
   Resume text: "GPA: 3.72"
   Backend hashes: SHA256(3.72) = 0xABC123...
   ```

2. **Candidate calls `/proof/generate`** (backend → contract)
   ```
   POST /proof/generate
   {
     "credential_id": "cred_456",
     "threshold": 3.5
   }
   
   Backend calls:
   → contract.store_credential(0xABC123...)
   → On-chain: credentialRegistry[0xABC123...] = {..., owner, ...}
   ```

3. **Backend generates ZK proof**
   ```
   Witness provides: GPA = 3.72 (off-chain only)
   Backend calls:
   → contract.verify_gpa_proof(0xABC123..., proofHash, 3500)
   → On-chain: proofRegistry[proofHash] = {
       credentialHash: 0xABC123...,
       proofType: 1 (GPA),
       isValid: true,  // because 3.72 > 3.5
       timestamp: ...
     }
   
   Response to candidate:
   {
     "proof_id": "proof_789",
     "status": "generated"
   }
   ```

4. **Candidate applies to job** (backend → contract)
   ```
   POST /jobs/123/apply
   {
     "proof_ids": ["proof_789"]
   }
   
   Job requirements: GPA > 3.5
   
   Backend calls:
   → contract.verify_job_requirements(proofHash, 0x0..., 1, 0x0...)
   → Returns: TRUE (because GPA proof is valid)
   
   → contract.submit_application(jobId, candidateId, true)
   → On-chain: applicationRegistry[appId] = {
       jobId: 123,
       candidateId: 0xCandidate...,
       verificationResult: true,
       timestamp: ...
     }
   ```

5. **Employer sees result** (read application from contract)
   ```
   Application Status: VERIFIED
   
   Employer CAN see:
   ✓ Candidate wallet address
   ✓ Application timestamp
   ✓ Verification result (TRUE)
   
   Employer CANNOT see:
   ✗ GPA value (3.72)
   ✗ Any credential details
   ✗ Proof details or inputs
   ✗ How the proof was generated
   ```

---

## Privacy Guarantees

### What's Protected

| Data | Storage | Privacy |
|------|---------|---------|
| GPA (3.72) | Off-chain only | ✓ Protected |
| Hash of GPA | On-chain | ✓ (hash is one-way) |
| Verification result (TRUE/FALSE) | On-chain | ✗ Public |
| Timestamp | On-chain | ✗ Public |
| Wallet address | On-chain | ✗ Public |

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Employer reverse-engineers GPA from hash | Hash is cryptographically secure (one-way) |
| Employer tries to call `fetch_gpa_value()` | Witness is client-side only; contract can't access |
| Contract stores raw GPA | Code review + assertions prevent this |
| Proof reveals GPA value | ZK proof only confirms ">", not the actual value |

---

## Testing (MVP)

### Test Case 1: Credential Storage
```typescript
// Store credential hash
const hash = "0xABC123...";
await contract.store_credential(hash);

// Check it's registered
const status = await contract.check_credential_status(hash);
assert(status === true);
```

### Test Case 2: GPA Proof (Success)
```typescript
// Candidate GPA = 3.72, Threshold = 3.5
const proof = await generateGPAProof(gpa=3.72, threshold=3.5);

// Verify proof
await contract.verify_gpa_proof(
  credentialHash,
  proof.hash,
  threshold=3500
);

// Check result
const proofRecord = await contract.proofRegistry.lookup(proof.hash);
assert(proofRecord.isValid === true);
```

### Test Case 3: GPA Proof (Failure)
```typescript
// Candidate GPA = 3.2, Threshold = 3.5
const proof = await generateGPAProof(gpa=3.2, threshold=3.5);

// Verify proof
await contract.verify_gpa_proof(
  credentialHash,
  proof.hash,
  threshold=3500
);

// Check result
const proofRecord = await contract.proofRegistry.lookup(proof.hash);
assert(proofRecord.isValid === false);  // GPA is NOT > 3.5
```

### Test Case 4: Job Requirement Verification
```typescript
// GPA proof passed, experience proof failed
const resultTrue = await contract.verify_job_requirements(
  gpaProofHash,      // isValid: true
  expProofHash,      // isValid: false
  reqType1=1,        // GPA
  reqType2=2         // Experience
);

assert(resultTrue === false);  // Only passes if ALL requirements pass
```

---

## Deployment

### Build Contract
```bash
cd midnight/contracts
compact build VeriHire.compact
```

### Deploy to Midnight Preview Network

```bash
npm run deploy:preview
# Returns: contractAddress = 0x...
```

### Save Contract Address
Update backend config:
```env
MIDNIGHT_CONTRACT_ADDRESS=0x...
```

---

## Integration with Backend

### Backend Endpoints Using This Contract

1. **POST /proof/generate**
   - Calls: `store_credential()`, then `verify_gpa_proof()`
   
2. **POST /proof/verify**
   - Calls: `verify_job_requirements()`
   
3. **POST /jobs/{job_id}/apply**
   - Calls: `verify_job_requirements()`, then `submit_application()`

---

## References

- [Midnight Docs](https://docs.midnight.network)
- [Compact Language v0.19+](https://docs.midnight.network/develop/reference/compact/lang-ref)
- [VeriHire Backend](../../backend/app/services/midnight_service.py)
