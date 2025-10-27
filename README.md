# 🧠 Ananda - Mental Health Support Platform
A comprehensive mental health support platform designed to provide accessible, confidential, and professional mental wellness services to students and individuals worldwide.

## 🌟 Overview

Ananda is a modern web-based mental health platform that combines AI-powered support, professional counseling, and comprehensive mental health assessments. The platform is built with privacy and accessibility in mind, offering multiple pathways to mental wellness tailored to individual needs.

## ✨ Key Features

### 🤖 AI-Powered Support
- **24/7 AI Chat Support**: Instant, personalized support from an intelligent AI counselor
- **Contextual Responses**: AI understands emotional context and provides appropriate guidance
- **Always Available**: Round-the-clock support when you need it most

### 👨‍⚕️ Professional Counseling
- **Licensed Counselors**: Connect with certified mental health professionals
- **Secure Communication**: End-to-end encrypted chat sessions
- **Role-based Access**: Separate dashboards for students, counselors, and administrators

### 📊 Mental Health Assessment
- **PHQ-9 Depression Screening**: Scientifically-backed depression assessment
- **GAD-7 Anxiety Screening**: Comprehensive anxiety evaluation
- **Personalized Recommendations**: Get tailored suggestions based on your results
- **Progress Tracking**: Monitor your mental health journey over time

### 🎓 Student-Focused Features
- **Student Forum**: Anonymous peer support and discussion
- **Profile Management**: Complete your profile for personalized recommendations
- **Progress Dashboard**: Track your wellness journey and achievements
- **Institution Integration**: Connect with your educational institution

### 🔒 Privacy & Security
- **HIPAA Compliant**: Meets healthcare privacy standards
- **End-to-End Encryption**: All communications are secure
- **Confidential Sessions**: Your privacy is our priority
- **Anonymous Options**: Choose to remain anonymous when needed

## 🛠️ Technology Stack

### Frontend
- **HTML5 & CSS3**: Modern, responsive web design
- **Vanilla JavaScript**: Clean, efficient client-side logic
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Custom CSS**: Advanced animations and glass morphism effects

### Backend & Database
- **Supabase**: Backend-as-a-Service for authentication and database
- **PostgreSQL**: Robust relational database
- **Real-time Subscriptions**: Live updates for chat and notifications

### AI & Functions
- **Supabase Edge Functions**: Serverless functions for AI integration
- **Deno Runtime**: Modern JavaScript runtime for edge functions
- **Custom AI Logic**: Extensible AI response system

### External Integrations
- **Google Apps Script**: Data export and analytics
- **Google Sheets**: Automated data collection and reporting
- **OAuth Integration**: Google Sign-in support

## 📁 Project Structure

```
health-project/
├── 📄 Core Pages
│   ├── index.html              # Landing page with features and testimonials
│   ├── login.html              # Authentication page with role selection
│   ├── signup.html             # User registration
│   ├── student.html            # Student dashboard and profile management
│   ├── counselor.html          # Counselor dashboard and student management
│   ├── admin.html              # Administrative panel
│   └── anonymous.html          # Anonymous support access
│
├── 💬 Communication Features
│   ├── chat.html               # Human counselor chat interface
│   ├── chat1.html              # AI chat interface
│   ├── chatbot.html            # Alternative AI chat
│   └── academic.chat.html      # Academic support chat
│
├── 🧠 Mental Health Tools
│   ├── screening.html          # Mental health assessment
│   ├── screening1.html         # Alternative screening interface
│   └── mental.health.html      # Mental health resources
│
├── 👥 Community & Support
│   ├── studentforum/           # Student forum directory
│   ├── social.html             # Social features
│   └── forum.js                # Forum functionality
│
├── 🎨 Styling & Assets
│   ├── style.css               # Main stylesheet with CSS variables
│   ├── favicon.png             # Site favicon
│   └── ananda.png              # Logo assets
│
├── ⚙️ Configuration
│   ├── package.json            # Project dependencies
│   ├── firebase-config.js      # Firebase configuration
│   ├── firebaseconfig.js       # Alternative Firebase config
│   └── supBaseClient.js        # Supabase client configuration
│
└── 🚀 Backend Services
    └── supabase/
        ├── config.toml         # Supabase project configuration
        └── functions/
            └── ai-chat/
                ├── index.ts    # AI chat edge function
                └── deno.json   # Deno configuration
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (for development)
- Supabase account (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/health-project.git
   cd health-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   - Create a new Supabase project
   - Update the Supabase URL and API key in the configuration files
   - Set up the database schema (tables for profiles, chat_messages, screening_questions, etc.)

4. **Configure Google Apps Script** (Optional)
   - Set up Google Apps Script for data export
   - Update the script URLs in the relevant files

5. **Deploy Supabase Functions**
   ```bash
   supabase functions deploy ai-chat
   ```

6. **Start the development server**
   ```bash
   # For local development, serve the files using any static server
   python -m http.server 8000
   # or
   npx serve .
   ```

## 🗄️ Database Schema

### Core Tables
- **profiles**: User profiles with role-based access
- **chat_messages**: Conversation history between users and AI/counselors
- **screening_questions**: Mental health assessment questions
- **screening_responses**: User responses to screening questions
- **screening_scores**: Calculated scores and interpretations

### Key Features
- **Role-based Access Control**: Students, counselors, and administrators
- **Real-time Updates**: Live chat and notification system
- **Data Privacy**: Secure storage with encryption at rest

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#3498db) - Trust and reliability
- **Secondary**: Purple (#9b59b6) - Creativity and wisdom
- **Accent**: Pink (#e91e63) - Care and compassion
- **Supporting**: Teal, Green, Orange for various UI elements

### Typography
- **Primary Font**: Inter (Google Fonts)
- **Fallback**: System fonts (San Francisco, Segoe UI, etc.)
- **Hierarchy**: Clear heading structure with proper contrast

### Components
- **Cards**: Glass morphism with subtle shadows
- **Buttons**: Gradient backgrounds with hover animations
- **Forms**: Clean inputs with focus states
- **Navigation**: Responsive with mobile-first approach

## 🔧 Configuration

### Environment Variables
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_SCRIPT_URL=your_google_apps_script_url
```

### Supabase Setup
1. Create tables for profiles, chat_messages, screening_questions
2. Set up Row Level Security (RLS) policies
3. Configure authentication providers
4. Deploy edge functions

## 📱 Responsive Design

The platform is fully responsive and optimized for:
- **Desktop**: Full-featured experience with sidebar navigation
- **Tablet**: Adapted layouts with touch-friendly interactions
- **Mobile**: Streamlined interface with collapsible navigation

## 🔒 Security Features

- **Authentication**: Supabase Auth with email/password and OAuth
- **Authorization**: Role-based access control
- **Data Encryption**: All sensitive data encrypted in transit and at rest
- **Privacy**: Anonymous options and confidential sessions
- **Compliance**: HIPAA-compliant data handling

## 🚀 Deployment

### Production Deployment
1. **Static Hosting**: Deploy to Vercel, Netlify, or similar
2. **Supabase**: Use Supabase hosting for backend services
3. **CDN**: Configure CDN for global performance
4. **SSL**: Ensure HTTPS is enabled

### Environment Setup
- **Development**: Local development with hot reload
- **Staging**: Test environment with production-like setup
- **Production**: Optimized build with monitoring

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 📊 Analytics & Monitoring

- **User Analytics**: Track user engagement and feature usage
- **Performance Monitoring**: Monitor page load times and API response times
- **Error Tracking**: Log and monitor application errors
- **Health Metrics**: Track mental health assessment trends (anonymized)

## 🆘 Support & Resources

### For Users
- **Help Center**: Comprehensive FAQ and guides
- **Contact Support**: Direct support through the platform
- **Emergency Resources**: Crisis support and emergency contacts

### For Developers
- **API Documentation**: Complete API reference
- **Code Examples**: Sample implementations
- **Community Forum**: Developer discussions and support



## 🙏 Acknowledgments

- **Supabase**: For providing an excellent backend-as-a-service platform
- **Tailwind CSS**: For the utility-first CSS framework
- **Google Fonts**: For the Inter font family
- **Mental Health Professionals**: For guidance on assessment tools and best practices
- **Open Source Community**: For the tools and libraries that made this project possible

## 📞 Contact

- **Project Maintainer**: [Yash vijayvargiya]
- **Email**: [yashvijayvergiya911@gmail.com]
- **GitHub**: [kanha077]

---

**⚠️ Important Disclaimer**: This platform is designed to provide mental health support and screening tools, but it is not a replacement for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for serious mental health concerns.

**🆘 Crisis Support**: If you're experiencing a mental health crisis, please contact your local emergency services or a crisis hotline immediately.

---


Made with ❤️ for mental health awareness and support
