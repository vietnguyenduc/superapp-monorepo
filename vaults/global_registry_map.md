# Global Registry Map

This document acts as the cross-context source of truth for the workspace, allowing the Core Governance AI Engine to pull references across different modules and apps.

## Apps (`/apps`)
- `accounting`: Financial accounting app.
- `admin-portal`: Administrative management interface.
- `antigravity-telegram-agent`: Telegram bot integration for AI workflows.
- `cashflow`: Cash flow management application.
- `docs`: Documentation site.
- `hr-operation`: Human Resources operation module.
- `inventory-operation`: Inventory management and tracking.
- `operations-portal`: Central portal for internal operations.
- `sales-operation`: Sales tracking and management.
- `superapp-business-bot`: Business-facing chatbot integration.
- `web`: Public facing website or main web client.

## Root Level Services
- `super-scraper`: Centralized scraping architecture service. Includes Flask UI server (`ui_server.py`), API server (`api_server.py`), Telegram bot (`telegram_bot.py`), AI scraping agent (`agent/`), and storage layer (`storage/`).

## Shared Scripts (`/scripts`)
- `start_service.ps1`: Chuẩn hoá start/stop/restart/status cho Flask, ngrok, bot. Dùng `-WindowStyle Hidden` + `-PassThru` để tránh timeout 120s. Hỗ trợ `-Action start|stop|restart|status` và `-Service flask|ngrok|bot|all`.

## Shared Packages (`/packages`)
- `einvoice`: Electronic invoicing utilities.
- `eslint-config`: Shared linting rules.
- `hooks`: Reusable React hooks.
- `iam`: Identity and Access Management shared logic.
- `shared-utils`: Common utility functions.
- `theme`: Shared UI theme definitions.
- `types`: TypeScript interfaces and type definitions.
- `typescript-config`: Shared tsconfig configurations.
- `ui`: Shared UI component library.
