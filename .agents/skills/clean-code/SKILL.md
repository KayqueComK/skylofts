---
name: clean-code
description: "This skill embodies the principles of \"Clean Code\" by Robert C. Martin (Uncle Bob). Use it to transform \"code that works\" into \"code that is clean.\""
risk: safe
source: "ClawForge (https://github.com/jackjin1997/ClawForge)"
date_added: "2026-02-27"
---

# Clean Code Skill

This skill embodies the principles of "Clean Code" by Robert C. Martin (Uncle Bob). Use it to transform "code that works" into "code that is clean."

## 🧠 Core Philosophy
> "Code is clean if it can be read, and enhanced by a developer other than its original author." — Grady Booch

## When to Use
Use this skill when:
- **Writing new code**: To ensure high quality from the start.
- **Reviewing Pull Requests**: To provide constructive, principle-based feedback.
- **Refactoring legacy code**: To identify and remove code smells.
- **Improving team standards**: To align on industry-standard best practices.

## 1. Meaningful Names
- **Use Intention-Revealing Names**: `elapsedTimeInDays` instead of `d`.
- **Avoid Disinformation**: Don't use `accountList` if it's actually a `Map`.
- **Make Meaningful Distinctions**: Avoid `ProductData` vs `ProductInfo`.
- **Use Pronounceable/Searchable Names**: Avoid `genymdhms`.
- **Class Names**: Use nouns (`Customer`, `WikiPage`). Avoid `Manager`, `Data`.
- **Method Names**: Use verbs (`postPayment`, `deletePage`).

## 2. Functions
- **Small!**: Functions should be shorter than you think.
- **Do One Thing**: A function should do only one thing, and do it well.
- **One Level of Abstraction**: Don't mix high-level business logic with low-level details (like regex).
- **Descriptive Names**: `isPasswordValid` is better than `check`.
- **Arguments**: 0 is ideal, 1-2 is okay, 3+ requires a very strong justification.
- **No Side Effects**: Functions shouldn't secretly change global state.

## 3. Comments
- **Don't Comment Bad Code—Rewrite It**: Most comments are a sign of failure to express ourselves in code.
- **Explain Yourself in Code**: 
  ```python
  # Check if employee is eligible for full benefits
  if employee.flags & HOURLY and employee.age > 65:
  ```
  vs
  ```python
  if employee.isEligibleForFullBenefits():
  ```
- **Good Comments**: Legal, Informative (regex intent), Clarification (external libraries), TODOs.
- **Bad Comments**: Mumbling, Redundant, Misleading.
