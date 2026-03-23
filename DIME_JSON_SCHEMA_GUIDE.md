# DIME JSON Template Schema Guide

If you prefer building your templates manually via JSON instead of the UI Builder, this guide provides the **exact schema structure** guaranteed to parse correctly and render linear scoring scales without errors.

## Base Template Structure

```json
{
  "schema_version": "1.1",
  "template_id": "unique-id-here",
  "template_name": "DIME Personal Screening",
  "template_type": "personal", 
  "job_titles": ["All Roles"],
  "stage": "First Interview",
  "domains": ["Belief", "Ownership", "Thinking", "Behavior", "Skills"],
  "sections": []
}
```

### Key Top-Level Fields:
- **`template_type`** (Required): Must be exactly `"personal"` or `"technical"`.
- **`domains`** (Optional but Recommended): An array of strings representing the evaluation vectors you care about (e.g., `["Ownership", "Belief"]`).

---

## Sections & Questions Structure

Inside the `"sections"` array, you define blocks of questions.

```json
  "sections": [
    {
      "section_id": "section_1",
      "title": "1. Ownership & Growth",
      "weight": 100,
      "questions": [
        
        // Example 1: Long Text Notes Question
        {
          "prompt": "Tell me about a time you owned a major failure.",
          "type": "long_text",
          "required": true
        },

        // Example 2: Linear Scale Scoring Question
        {
          "prompt": "Ownership Score: Did they take responsibility?",
          "type": "scale",
          "required": true,
          "score_enabled": true,
          "dimension_key": "Ownership",
          "min": 1,
          "max": 5,
          "weight": 100
        }
      ]
    }
  ]
```

### Key Question Fields:
- **`prompt`** or **`text`**: The actual question string (both are supported).
- **`type`**: 
  - Use `"scale"` or `"linear_scale"` for a 1-5 scoring block.
  - Use `"long_text"` for standard notes.
- **`dimension_key`**: If you are using a `scale`, this field tells the DIME engine which domain to aggregate the score into (e.g., `"Ownership"`). **This string must perfectly match one of the strings inside your Top-Level `domains` array.**
- **`weight`**: Numeric multiplier for this question (default 100).
