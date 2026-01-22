# { "Depends": "py-genlayer:test" }
"""
AI-Verified Task Completion Contract
"""

from genlayer import *
import json


class TaskVerifier(gl.Contract):
    """
    An Intelligent Contract for AI-verified task completion.
    """
    
    task_counter: u256
    tasks: TreeMap[u256, str]
    
    def __init__(self):
        self.task_counter = u256(0)
    
    @gl.public.write
    def create_task(
        self,
        title: str,
        description: str,
        verification_criteria: str,
        reward_amount: int
    ) -> int:
        task_id = int(self.task_counter)
        self.task_counter = u256(task_id + 1)
        
        task_data = {
            "creator": str(gl.message.sender_address),
            "title": title,
            "description": description,
            "criteria": verification_criteria,
            "reward": reward_amount,
            "status": "open",
            "worker": "",
            "proof_url": "",
            "result": ""
        }
        
        self.tasks[u256(task_id)] = json.dumps(task_data)
        return task_id
    
    @gl.public.write
    def claim_task(self, task_id: int) -> bool:
        key = u256(task_id)
        if key not in self.tasks:
            return False
            
        task = json.loads(self.tasks[key])
        
        if task["status"] != "open":
            return False
        
        task["status"] = "claimed"
        task["worker"] = str(gl.message.sender_address)
        self.tasks[key] = json.dumps(task)
        
        return True
    
    @gl.public.write
    def submit_proof(self, task_id: int, proof_url: str) -> bool:
        key = u256(task_id)
        if key not in self.tasks:
            return False
            
        task = json.loads(self.tasks[key])
        
        if task["status"] != "claimed":
            return False
        
        task["status"] = "submitted"
        task["proof_url"] = proof_url
        self.tasks[key] = json.dumps(task)
        
        return True
    
    @gl.public.write
    def verify_completion(self, task_id: int) -> str:
        key = u256(task_id)
        if key not in self.tasks:
            return "ERROR: Task not found"
            
        task = json.loads(self.tasks[key])
        
        if task["status"] != "submitted":
            return "ERROR: Task not in submitted state"
        
        title = task["title"]
        description = task["description"]
        criteria = task["criteria"]
        proof_url = task["proof_url"]
        
        def fetch_evidence():
            web_data = gl.get_webpage(proof_url, mode="text")
            return web_data
        
        evidence = gl.eq_principle_strict_eq(fetch_evidence)
        
        if not evidence or len(evidence) < 50:
            task["status"] = "rejected"
            task["result"] = "Could not access proof URL"
            self.tasks[key] = json.dumps(task)
            return "REJECTED: Could not access proof URL"
        
        truncated_evidence = evidence[:4000]
        
        verification_prompt = f"""You are verifying task completion for a bounty system.

TASK TITLE: {title}

TASK DESCRIPTION: {description}

VERIFICATION CRITERIA: {criteria}

SUBMITTED EVIDENCE (from {proof_url}):
{truncated_evidence}

Based on the evidence, determine if the task is completed.

Respond with EXACTLY one of:
VERIFIED: [brief explanation]
OR
REJECTED: [brief explanation]"""
        
        def analyze_evidence():
            result = gl.exec_prompt(verification_prompt)
            return result
        
        final_result = gl.eq_principle_prompt_non_comparative(
            analyze_evidence,
            task=f"Verify task completion for: {title}",
            criteria=f"Assessment must reflect whether evidence satisfies: {criteria}"
        )
        
        if "VERIFIED" in final_result.upper():
            task["status"] = "verified"
            task["result"] = final_result
            self.tasks[key] = json.dumps(task)
            return "VERIFIED: " + final_result
        else:
            task["status"] = "rejected"
            task["result"] = final_result
            self.tasks[key] = json.dumps(task)
            return "REJECTED: " + final_result
    
    @gl.public.view
    def get_task(self, task_id: int) -> str:
        key = u256(task_id)
        if key not in self.tasks:
            return "{}"
        return self.tasks[key]
    
    @gl.public.view
    def get_task_status(self, task_id: int) -> str:
        key = u256(task_id)
        if key not in self.tasks:
            return "not_found"
        
        task = json.loads(self.tasks[key])
        return task["status"]
    
    @gl.public.view
    def get_total_tasks(self) -> int:
        return int(self.task_counter)
