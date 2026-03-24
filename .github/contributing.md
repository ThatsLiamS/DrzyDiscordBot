# Contributing to Quintus & Co.

Thank you for contributing to the Quintus & Co. platform. To maintain the high standards of our strategic consultancy, we follow strict guidelines regarding community behavior and code quality.

---

## Code of Conduct

We pledge to make our community welcoming, safe, and equitable for all. We are committed to fostering an environment that respects and promotes the dignity, rights, and contributions of all individuals.

### Encouraged Behaviors
We agree to behave mindfully toward each other and act in ways that center our shared values, including:
* Respecting the purpose of our community, our activities, and our ways of gathering.
* Engaging kindly and honestly with others.
* Respecting different viewpoints and experiences.
* Taking responsibility for our actions and contributions.
* Gracefully giving and accepting constructive feedback.
* Committing to repairing harm when it occurs.

### Restricted Behaviors
Instances, threats, and promotion of the following behaviors are violations of this Code of Conduct:
* **Harassment**: Violating explicitly expressed boundaries or engaging in unnecessary personal attention.
* **Character attacks**: Making insulting, demeaning, or pejorative comments.
* **Stereotyping or discrimination**: Characterizing anyone’s personality or behavior on the basis of immutable identities.
* **Violating confidentiality**: Sharing or acting on someone's personal or private information without permission.

**To report a possible violation**, please email the project manager at **me AT liamskinner.co.uk**.

---

# Development Workflow

## Security First

Security is a non-negotiable priority:
- Never commit API keys or secrets (ensure `.env` is ignored).
- Validate and sanitize all user inputs to prevent XSS or injection.

---

## Git Commit Message Convention

To ensure a clean and professional project history, all commit messages must follow the Conventional Commits specification.

### Message Validation
Messages must be matched by the following regex:
```
/^(revert: )?(feat|fix|perf|refactor|test|style|chore|build)(\(.+\))?: .{1,72}/
```

### Format
A commit message consists of a header, body, and footer:
```text
<type>(<scope>): <subject>

<body>

<footer>
```
### Header Requirements
The header is mandatory. The type defines the kind of change being made:

| Type | Description |
|---|---|
|feat | A new feature for the application. |
|fix | A bug fix. |
|perf | A code change that improves performance. |
|refactor | A code change that neither fixes a bug nor adds a feature. |
|style | Formatting only (whitespace, semi-colons, etc.). |
|chore | Routine tasks such as updating dependencies. |
|build | Changes to the build system or scripts.|

### Subject Rules:
- Use the imperative, present tense (e.g., "change" not "changed").
- Do not capitalize the first letter.Do not add a dot (.) at the end.
- Maximum length of 72 characters.

# Submission Process

1. **Security Check:** As this is a wealth consultancy platform, ensure no API keys or sensitive configurations are committed.
2. **Branching:** Create a feature branch (e.g., feat/calendar-api) from the main development branch.
3. **Commit:** Use the mandatory header format and subject rules defined above.
4. **Pull Request:** Detail the motivation for the change and contrast it with previous behavior in the body.