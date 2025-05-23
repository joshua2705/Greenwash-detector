import re
import json
import os
from litellm import completion
from agents import Agent, Runner, function_tool, set_tracing_disabled
from agents.extensions.models.litellm_model import LitellmModel
from rag_storage import analyze_document

# ——————— Utilities ———————


def clean_groq_output(raw_text: str) -> str:
    """
    Cleans raw model output by:
      1. Removing any internal <think>...</think> reasoning blocks
      2. Un-escaping literal sequences (\n, \", \', \\\\)
      3. Stripping leading/trailing whitespace

    Input:
      raw_text (str): The raw string output from the LLM
    Output:
      str: Cleaned text, ready for JSON parsing or direct use
    """
    cleaned = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL)
    cleaned = (
        cleaned.replace("\\n", "\n")
        .replace("\\'", "'")
        .replace('\\"', '"')
        .replace("\\\\", "\\")
    )
    return cleaned.strip()


API_KEY = "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"
MODEL = "groq/qwen-qwq-32b"

def parse_agent_output(output: str) -> dict:
    """
    Parse the agent's six-section response into a dict with keys:
      - retrieved_evidence
      - conclusion
      - justification
      - rewritten_statement
      - suggestions_for_improvement
      - greenwashing_category
    """
    pattern = (
        r"1\.\s*Retrieved Evidence\s*(.*?)\s*"
        r"2\.\s*Conclusion\s*(.*?)\s*"
        r"3\.\s*Justification\s*(.*?)\s*"
        r"4\.\s*Rewritten Statement\s*(.*?)\s*"
        r"5\.\s*Suggestions for Improvement\s*(.*?)\s*"
        r"6\.\s*Greenwashing Category\s*(.*)"
    )
    match = re.search(pattern, output, re.DOTALL)
    if not match:
        raise ValueError("Response did not match expected format")
    return {
        "retrieved_evidence": match.group(1).strip(),
        "conclusion": match.group(2).strip(),
        "justification": match.group(3).strip(),
        "rewritten_statement": match.group(4).strip(),
        "suggestions_for_improvement": match.group(5).strip(),
        "greenwashing_category": match.group(6).strip(),
    }


# ——————— Tools ———————


@function_tool
def retrieve_evidence(marketing_statement: str) -> list:
    """
    Stub RAG tool that retrieves company evidence snippets for a given marketing claim.

    Input:
      query (str): The marketing statement or claim to validate.
    Output:
      list of str: A list of evidence snippets (company report lines). Empty if none.

    """
    return [
        analyze_document('Return ALL the evidence most relevant to the statement: ' + marketing_statement, "./asset/2024_annual_report.pdf")
    ]


@function_tool
def retrieve_laws(marketing_statement: str) -> list:
    """
    Stub tool that retrieves relevant greenwashing laws or regulations for a given claim.
    """
    return [
        analyze_document('Return ALL the regulations most relevant to the statement: ' + marketing_statement, "./asset/greenwashing_laws.csv")
    ]


@function_tool
def analyze_greenwashing(marketing_statement: str, evidence: list, laws: list) -> str:
    """
    Analyzes whether the marketing statement is greenwashing based only on the evidence and the laws provided in the rag results output.

    Input:
      marketing_statement (str): The claim to analyze.
      evidence (list of str): Extracted company information snippets.
      laws (list of str): Extracted laws and regulations snippets.
    Output:
      str: A JSON-formatted string with fields:
        {
          "is_greenwashing": bool,
          "explanation": str  # Justification quoting evidence if any and mention any laws if applicable
        }

    Behavior:
      - If `evidence` is empty, returns is_greenwashing=false and a fallback explanation.
      - Otherwise, prompts the LLM to detect misleading or unsupported claims.
    """
    if not evidence:
        return json.dumps(
            {
                "is_greenwashing": False,
                "explanation": "No company information available; cannot confirm or deny greenwashing.",
            }
        )

    prompt = f"""
You are a sustainability analyst.
User claim: "{marketing_statement}"
Company info (RAG results): {json.dumps(evidence, indent=2)}

Respond with valid JSON exactly in this form:
{{ 
  "is_greenwashing": <true|false>,
  "explanation": "<quote relevant passages and justify your decision>"
}}
"""
    resp = completion(
        messages=[
            {"role": "system", "content": "Detect greenwashing in marketing copy."},
            {"role": "user", "content": prompt},
        ],
        model=MODEL,
        api_key=API_KEY,
    )
    return clean_groq_output(resp.choices[0].message.content)


@function_tool
def rewrite_statement(original_statement: str, analysis_json: str) -> str:
    """
    Rewrites a marketing statement to remove any greenwashing, based on analysis.

    Input:
      original_statement (str): The original marketing copy.
      analysis_json (str): JSON output from `analyze_greenwashing` tool.
    Output:
      str: A JSON-formatted string with fields:
        {
          "revised_statement": str,  # Corrected marketing copy
          "justification": str       # How the rewrite improves honesty
        }

    Behavior:
      - If analysis_json indicates no greenwashing, echoes original with explanation.
      - Otherwise, prompts the LLM to produce a rewritten, accurate statement.
    """
    analysis = json.loads(analysis_json)
    if not analysis.get("is_greenwashing", False):
        return json.dumps(
            {
                "revised_statement": original_statement,
                "justification": analysis["explanation"],
            }
        )

    prompt = f"""
You are a copy editor focused on sustainability accuracy.
Original statement: "{original_statement}"
Greenwashing analysis:
{json.dumps(analysis, indent=2)}

Respond with valid JSON exactly in this form:
{{
  "revised_statement": "<rewrite to avoid any misleading claims>",
  "justification": "<explain how the rewrite improves honesty>"
}}
"""
    resp = completion(
        messages=[
            {
                "role": "system",
                "content": "Rewrite marketing copy to avoid greenwashing.",
            },
            {"role": "user", "content": prompt},
        ],
        model=MODEL,
        api_key=API_KEY,
    )
    return clean_groq_output(resp.choices[0].message.content)


# ——————— Agent setup ———————

set_tracing_disabled(True)
agent = Agent(
    name="GreenwashingInspector",
    instructions=(
        "You are an AI that detects and corrects greenwashing in marketing statements.\n\n"
        "Use these tools:\n"
        "- retrieve_evidence(marketing_statement) to get only factual company sustainability data related to the marketing statement.\n"
        "- retrieve_laws(marketing_statement) to get factual laws and regulations related to greenwashing in the marketing statement.\n"
        "- analyze_greenwashing(marketing_statement, evidence) to decide if the claim is greenwashing.\n"
        "- rewrite_statement(original_statement, analysis_json) to output a corrected version.\n\n"
        "For every input statement, return exactly:\n\n"
        "1. Retrieved Evidence\n"
        "   Concise facts from retrieve_evidence(marketing_statement).\n\n"
        "2. Conclusion\n"
        "   **Greenwashing Detected** or **No Greenwashing Detected**.\n\n"
        "3. Justification\n"
        "   Brief reason quoting only the retrieved evidence. Here also refer to the retrieved laws and regulations that are potentially violated\n\n"
        "4. Rewritten Statement\n"
        "   Accurate, transparent claim from rewrite_statement.\n\n"
        "5. Suggestions for Improvement\n"
        "   2–3 concise, evidence-based edits.\n\n"
        "6. Greenwashing Category\n"
        "   Choose one and explain with evidence:\n"
        "     a) Ambiguous Claims: Vague, metric-free language.\n"
        "     b) Hidden Trade-offs: Only one eco aspect highlighted.\n"
        "     c) Visual Deception: Misleading imagery.\n"
        "     d) Misleading Metrics: Incorrect or unverified numbers.\n"
        "     e) Empty Promises: Commitments without a real plan.\n"
        "     f) Unverified Certifications: Fake or non-verified labels.\n"
        "     g) Compliance as Leadership: Framing legal duty as a choice.\n"
    ),
    model=LitellmModel(model=MODEL, api_key=API_KEY),
    tools=[retrieve_evidence, retrieve_laws, analyze_greenwashing, rewrite_statement],
)

# ——————— Example run ———————


async def main():
    # Test with a sample marketing statement
    marketing_statement = "Our operations are 100% carbon neutral"
    result = await Runner.run(agent, marketing_statement)
    print(result.final_output)


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
