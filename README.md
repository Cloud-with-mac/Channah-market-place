# MarketHub - Multi-Vendor E-Commerce Marketplace

A full-featured marketplace platform similar to Amazon, eBay, and Jumia, built with modern technologies and AI integration.

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern UI components
- **Zustand** - State management
- **React Query** - Server state management
- **Socket.io Client** - Real-time features

### Backend
- **FastAPI** - Modern Python API framework
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations
- **Celery** - Background tasks
- **Socket.io** - Real-time communication

### AI Features
- **OpenAI GPT-4** - Chatbot and content generation
- **Semantic Search** - Vector embeddings for smart search
- **Recommendation Engine** - Personalized product suggestions
- **Image Recognition** - Auto-categorization and tagging
- **Fraud Detection** - ML-based transaction monitoring

### Payment Gateways
- Stripe (Global)
- PayPal (Global)
- Flutterwave (Africa)
- Razorpay (India)

## Features

### For Customers
- User registration and authentication (Email, Google, Facebook)
- Advanced product search with AI-powered suggestions
- Product recommendations based on browsing history
- Shopping cart and wishlist
- Multiple payment options
- Order tracking with real-time updates
- Reviews and ratings
- AI chatbot for customer support

### For Vendors
- Vendor registration and verification
- Product management (CRUD, bulk upload)
- Inventory management
- Order management
- Sales analytics and reports
- Payout management
- Store customization

### For Admins
- User and vendor management
- Category management
- Commission settings
- Platform analytics
- Content moderation
- Dispute resolution

## Project Structure

```
marketplace/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configurations
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   ├── ai/             # AI integrations
│   │   └── utils/          # Utilities
│   ├── alembic/            # Database migrations
│   └── tests/              # Backend tests
├── frontend/               # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities and configs
│   ├── hooks/             # Custom hooks
│   ├── store/             # State management
│   └── types/             # TypeScript types
├── docker/                # Docker configurations
└── docs/                  # Documentation
```

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Copy `.env.example` to `.env` and configure all required variables.

## License
MIT License
