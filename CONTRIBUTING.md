# Contributing to SuperApp Monorepo

Welcome! This guide will help you get started with contributing to this project.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- Git

### Setup
```bash
# Clone the repository
git clone https://github.com/[your-org]/superapp-monorepo.git
cd superapp-monorepo

# Install dependencies
npm install

# Start development server (cashflow app)
npm run dev --workspace=cashflow
```

---

## 📁 Project Structure

```
superapp-monorepo/
├── apps/                    # Application packages
│   ├── cashflow/           # Cash flow management app
│   └── inventory-operation/ # Inventory operations app
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md     # System architecture
│   └── CODING_STANDARDS.md # Coding guidelines
└── package.json            # Root workspace config
```

---

## 🤖 Working with AI Assistants (Vibe Coding)

This project is designed to work well with AI coding assistants. Follow these practices:

### 🚨 CRITICAL FILE OPERATION RULES
**⚠️ NEVER use `write_to_file` for existing files!**

1. **ALWAYS Read First**: Before editing any file, use `read_file` to understand current content
2. **Use Edit Tools**: For existing files, use `edit` or `multi_edit` - NEVER `write_to_file`
3. **Check File Existence**: If unsure if file exists, use `find_by_name` or `list_dir` first
4. **Context Matters**: Read surrounding code to understand context before making changes

### Common Mistakes to Avoid:
- ❌ Creating new files when they already exist
- ❌ Using `write_to_file` on existing files (corrupts them)
- ❌ Making edits without reading the current content
- ❌ Assuming file structure without verification

### Correct Workflow:
1. `read_file` → Understand current state
2. `edit`/`multi_edit` → Make targeted changes
3. Verify with `read_file` if needed

### Before Starting a Session
1. **Share context**: Point the AI to `apps/[app-name]/AI_CONTEXT.md`
2. **State your goal clearly**: "I want to add feature X to the Dashboard"
3. **Mention constraints**: "Don't change the existing API interface"

### Starting Prompt Template
```
I'm working on the [app-name] app in the superapp-monorepo. 
Please read AI_CONTEXT.md in apps/[app-name]/ for project context.

My goal today is: [describe your goal]

Constraints:
- [any specific constraints]
```

### After Each Session
1. Update `AI_CONTEXT.md` with:
   - What was completed
   - What's in progress
   - Any known issues
   - Next steps

### Example AI_CONTEXT.md Update
```markdown
### Session 2026-01-25
**Goal**: Add customer search feature
**Changes Made**:
- Added SearchBar component
- Integrated with customer list
- Added debounce for performance

**Current Issue**: 
- Search doesn't work with Vietnamese characters

**Next Steps**:
1. Fix Vietnamese character search
2. Add search result highlighting
```

---

## 📝 Commit Guidelines

### Commit Message Format
```
type(scope): description

[optional body]
[optional footer]
```

### Types
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change that neither fixes nor adds |
| `test` | Adding tests |
| `chore` | Maintenance tasks |

### Examples
```bash
feat(cashflow): add time range filter to dashboard
fix(cashflow): resolve duplicate dates in chart
docs: update AI_CONTEXT.md with session notes
refactor(cashflow): extract chart logic to custom hook
```

---

## 🔄 Workflow

### Feature Development
1. **Create branch**: `git checkout -b feat/your-feature-name`
2. **Make changes**: Follow coding standards
3. **Test locally**: Ensure app works
4. **Update docs**: Update AI_CONTEXT.md if needed
5. **Commit**: Use conventional commit messages
6. **Push**: `git push origin feat/your-feature-name`
7. **Create PR**: Include description of changes

### Bug Fixes
1. **Create branch**: `git checkout -b fix/bug-description`
2. **Identify root cause**: Don't just fix symptoms
3. **Fix the issue**: Minimal changes preferred
4. **Test**: Verify fix works
5. **Commit & PR**: Include issue reference if applicable

---

## 📋 Code Review Checklist

Before requesting review:
- [ ] Code follows [CODING_STANDARDS.md](./docs/CODING_STANDARDS.md)
- [ ] All text uses i18n (no hardcoded strings)
- [ ] TypeScript has no errors
- [ ] App runs without console errors
- [ ] AI_CONTEXT.md updated (if architecture changed)
- [ ] Commit messages follow convention

---

## 🌐 Internationalization

All user-facing text must use i18n:

```typescript
// ✅ Correct
const { t } = useTranslation();
return <h1>{t("dashboard.title")}</h1>;

// ❌ Wrong
return <h1>Dashboard</h1>;
```

Add translations to:
- `apps/[app]/src/locales/en/translation.json`
- `apps/[app]/src/locales/vi/translation.json`

---

## 🐛 Reporting Issues

When reporting bugs, include:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Screenshots** (if applicable)
5. **Browser/environment info**

---

## 💡 Feature Requests

When proposing features:
1. **Describe the problem** you're trying to solve
2. **Propose a solution**
3. **Consider alternatives**
4. **Note any breaking changes**

---

## 📚 Documentation

### Key Documents
| Document | Purpose |
|----------|---------|
| `README.md` | Project overview |
| `docs/ARCHITECTURE.md` | System design |
| `docs/CODING_STANDARDS.md` | Code guidelines |
| `apps/*/AI_CONTEXT.md` | AI assistant context |

### Keeping Docs Updated
- Update AI_CONTEXT.md after significant changes
- Update ARCHITECTURE.md when adding new patterns
- Add JSDoc comments for public functions

---

## ❓ Getting Help

- Check existing documentation first
- Search closed issues/PRs
- Ask in team chat
- Create an issue if needed

Thank you for contributing! 🎉
