# Context: superapp-business-bot Revamp

## Environment
- OS: Windows
- Workspaces: `c:\Vibecoding\superapp-monorepo`
- Code Location: `c:\Vibecoding\superapp-monorepo\apps\superapp-business-bot`
- Database: Supabase (`https://peslmsctejmvkwzyohke.supabase.co`)
- LLM Provider Priority: Deepseek (Primary), Nvidia (Secondary), Gemini (Fallback)

## Goals and Scope
1. **Conversational Onboarding**: Prompt for email, send OTP/Magic Link using Supabase Auth, verify OTP, associate email with Telegram ID.
2. **User Roles**: Check role in Supabase.
   - Unassigned users: "Trial access" message + contact info for Mr. Viet (084 96 98 333).
   - Assigned members: "Welcome back" + company name, role, permissions, admin email.
3. **Dynamic Apps**: Query Supabase `apps` table for Vercel, localhost, ngrok URLs. Display walkthrough menu.
4. **AI Intent Routing**: Free-text intent parsing with Deepseek/Nvidia to guide the user, clarify intents, or route to specific apps/reports.

## Current Setup
- `main.py` is a Telegram bot client using `pyTelegramBotAPI` with existing commands `/start`, `/login`, `/apps`, etc.
- `core/auth_manager.py` manages local memory-based OTP and a mock mapping json file.
- `core/db.py` queries Supabase tables using REST/JSON over requests client.
- `core/ai_router.py` holds AI model registry and execution loop.
