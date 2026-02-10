def build_prompt(query: str, relevant_chunks: list[str], style: str = "balanced") -> str:
    if not relevant_chunks:
        return f"""You are a helpful assistant. Unfortunately, no context was provided to answer this question.

Question: {query}
Answer: The information is not available in the provided context."""

    context = "\n\n".join([f"[{i+1}] {chunk}" for i, chunk in enumerate(relevant_chunks)])

    # Style instruction mapping
    style_instruction = {
        "short": "Answer briefly and directly.",
        "balanced": "Answer clearly with an appropriate balance of brevity and detail.",
        "detailed": "Answer comprehensively, covering all relevant details in depth."
    }.get(style, "Answer clearly with an appropriate balance of brevity and detail.")  # fallback to balanced

    return f"""You are a helpful assistant answering questions based on the provided context.
{style_instruction}
Use only the information from the "Context" section below to answer the user's "Question".
Do not make up any information. If the answer is not present in the context, say so clearly.

If the question specifically refers to a citation (e.g., "According to Lee and Kim (2022)..."), examine the context for that citation and only answer based on what's provided. If the citation isn't in the context, state that directly.

Context:
{context}

Question: {query}
Answer:"""
