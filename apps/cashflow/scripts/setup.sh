#!/bin/bash

# Cashflow App Setup Script
# AI-Native Development Environment Setup

set -e

echo "🚀 Setting up Cashflow AI-Native Development Environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the cashflow app directory."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_NODE_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE_VERSION" ]; then
    echo "❌ Error: Node.js version $NODE_VERSION is too old. Please use Node.js >= $REQUIRED_NODE_VERSION"
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION is compatible"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📥 Installing Supabase CLI..."
    npm install -g supabase
else
    echo "✅ Supabase CLI is already installed"
fi

# Create environment file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# App Configuration
VITE_APP_NAME=Quản lý công nợ - TPL
VITE_APP_VERSION=1.0.0

# Development Configuration
VITE_DEV_MODE=true
VITE_DEBUG_MODE=true
EOF
    echo "⚠️  Please update .env.local with your actual configuration values"
else
    echo "✅ .env.local file already exists"
fi

# Create database directory if it doesn't exist
if [ ! -d "supabase" ]; then
    echo "🗄️  Initializing Supabase project..."
    supabase init
else
    echo "✅ Supabase project already initialized"
fi

# Run database migrations if they exist
if [ -f "db/schema.sql" ]; then
    echo "🔄 Applying database schema..."
    # Note: This would need to be adapted for your specific Supabase setup
    echo "⚠️  Please manually apply db/schema.sql to your Supabase project"
else
    echo "⚠️  No database schema found in db/schema.sql"
fi

# Run tests
echo "🧪 Running tests..."
npm test

# Build the project
echo "🔨 Building the project..."
npm run build

# Check build success
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Setup Git hooks if Git is initialized
if [ -d ".git" ]; then
    echo "🔧 Setting up Git hooks..."
    
    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# Pre-commit hook for Cashflow AI-Native Development

# Run linting
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Linting failed. Please fix linting errors before committing."
    exit 1
fi

# Run tests
npm test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Please fix failing tests before committing."
    exit 1
fi

echo "✅ Pre-commit checks passed"
EOF

    chmod +x .git/hooks/pre-commit
    echo "✅ Git hooks setup complete"
else
    echo "⚠️  Git repository not initialized. Skipping Git hooks setup."
fi

# Create development scripts
echo "📜 Creating development scripts..."

# Create start-dev.sh
cat > scripts/start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Cashflow Development Server..."
npm run dev
EOF
chmod +x scripts/start-dev.sh

# Create test-watch.sh
cat > scripts/test-watch.sh << 'EOF'
#!/bin/bash
echo "🧪 Starting Test Watch Mode..."
npm test -- --watch
EOF
chmod +x scripts/test-watch.sh

# Create build-prod.sh
cat > scripts/build-prod.sh << 'EOF'
#!/bin/bash
echo "🏗️  Building for Production..."
npm run build
echo "✅ Build complete. Output in dist/"
EOF
chmod +x scripts/build-prod.sh

# Create deploy.sh
cat > scripts/deploy.sh << 'EOF'
#!/bin/bash
echo "🚀 Deploying to Production..."
npm run build
echo "⚠️  Please configure your deployment script for your hosting platform"
EOF
chmod +x scripts/deploy.sh

echo "✅ Development scripts created"

# Setup AI Agents configuration
echo "🤖 Setting up AI Agents configuration..."

# Create agents config file
cat > agents/config.json << 'EOF'
{
  "orchestrator": {
    "enabled": true,
    "priority": 1,
    "timeout": 30000
  },
  "product_manager": {
    "enabled": true,
    "priority": 2,
    "timeout": 15000
  },
  "flow_simulator": {
    "enabled": true,
    "priority": 3,
    "timeout": 10000
  },
  "architecture": {
    "enabled": true,
    "priority": 4,
    "timeout": 20000
  },
  "builder": {
    "enabled": true,
    "priority": 5,
    "timeout": 25000
  },
  "qa_gatekeeper": {
    "enabled": true,
    "priority": 6,
    "timeout": 15000
  },
  "debug_engineer": {
    "enabled": true,
    "priority": 7,
    "timeout": 20000
  },
  "db_guardian": {
    "enabled": true,
    "priority": 8,
    "timeout": 10000
  },
  "devops_distribution": {
    "enabled": true,
    "priority": 9,
    "timeout": 15000
  },
  "knowledge": {
    "enabled": true,
    "priority": 10,
    "timeout": 5000
  }
}
EOF

echo "✅ AI Agents configuration created"

# Create initial documentation
echo "📚 Creating initial documentation..."

# Create README if it doesn't exist
if [ ! -f "README.md" ]; then
    cat > README.md << 'EOF'
# Cashflow - Quản lý công nợ thông minh

AI-Native Development Approach for modern debt management application.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## AI-Native Development

This project uses a multi-agent AI development approach:

- **Orchestrator**: Coordinates all agents
- **Product Manager**: Defines requirements
- **Flow Simulator**: Validates business logic
- **Architecture**: Designs system structure
- **Builder**: Implements code
- **QA Gatekeeper**: Ensures quality
- **Debug Engineer**: Fixes issues
- **DB Guardian**: Manages database
- **DevOps**: Handles deployment
- **Knowledge**: Maintains documentation

## Documentation

See the `docs/` directory for comprehensive documentation.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run linting

## Contributing

Please follow the AI-Native Development guidelines in `docs/project_rules.md`.
EOF
    echo "✅ README.md created"
else
    echo "✅ README.md already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your actual configuration"
echo "2. Apply the database schema to your Supabase project"
echo "3. Start the development server: npm run dev"
echo "4. Review the AI Agents documentation in agents/"
echo "5. Check the project documentation in docs/"
echo ""
echo "🚀 Happy coding with AI-Native Development!"
