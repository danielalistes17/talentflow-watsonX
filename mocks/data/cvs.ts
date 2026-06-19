export interface MockCv {
  serial: string;
  cv_language: string;
  cv_updated_at: string;
  overview: string;
  key_skills: Record<string, string[]>;
  digital_credentials: { name: string; year: number }[];
  ibm_assignments: {
    role_title: string;
    client_name: string;
    location: string;
    date_from: string;
    date_to: string | null;
    description: string;
    contribution: string[];
  }[];
  work_experience: {
    role_title: string;
    company_name: string;
    location: string;
    date_from: string;
    date_to: string;
    description: string;
  }[];
  industry_experience: { industry: string; proficiency: string }[];
  education: {
    degree_title: string;
    institution: string;
    country: string;
    graduation_year: number;
    specialization: string;
  }[];
  languages: {
    language: string;
    spoken_proficiency: string;
    written_proficiency: string;
  }[];
}

export const cvs: MockCv[] = [
  {
    serial: "IBM001",
    cv_language: "EN-GB",
    cv_updated_at: "2026-05-15",
    overview: "Senior Full Stack Solution Architect with 8+ years of experience delivering enterprise-grade applications for IBM's consulting clients across financial services, insurance, and telecommunications sectors. Proven track record in modernising legacy Java applications to cloud-native microservices on Red Hat OpenShift and AWS. Strong expertise in IBM Garage methodology, driving rapid prototyping and MVP delivery. Experienced in leading distributed teams across EMEA, conducting architecture reviews, and mentoring junior developers. Deep understanding of event-driven architectures, API-first design, and DevSecOps practices. Currently completing IBM Generative & Agentic AI Consultant certification to expand into AI-augmented application development.",
    key_skills: {
      backend: ["Java", "Spring Boot", "Node.js", "Express", "Kafka", "PostgreSQL", "MongoDB", "REST APIs", "GraphQL"],
      frontend: ["React", "TypeScript", "Carbon Design System", "Next.js"],
      cloud: ["AWS", "Red Hat OpenShift", "Docker", "Kubernetes", "Terraform", "Jenkins"],
      other: ["IBM Garage Methodology", "Agile/Scrum", "Solution Architecture", "Technical Leadership"],
    },
    digital_credentials: [
      { name: "IBM Generative & Agentic AI Consultant", year: 2026 },
      { name: "AWS Certified Solutions Architect – Associate", year: 2024 },
      { name: "IBM Full Stack Application Developer", year: 2023 },
      { name: "Red Hat Certified System Administrator", year: 2022 },
    ],
    ibm_assignments: [
      {
        role_title: "Solution Architect",
        client_name: "COFACE FR",
        location: "Paris, France (Remote from Zagreb)",
        date_from: "2024-09-01",
        date_to: "2026-02-28",
        description: "Business risk and credit intelligence platform modernisation. Migration of monolithic Java EE application to Spring Boot microservices deployed on OpenShift. Integration with external credit scoring APIs and real-time data ingestion pipelines.",
        contribution: [
          "Designed microservices architecture with 12 bounded contexts serving 2000+ daily active users",
          "Led migration of legacy SOAP services to RESTful APIs, reducing response latency by 60%",
          "Implemented event-driven architecture using Kafka for real-time credit risk scoring",
          "Mentored team of 6 developers across Zagreb and Paris offices",
        ],
      },
      {
        role_title: "Full Stack Developer",
        client_name: "GENERALI IT",
        location: "Zagreb, Croatia",
        date_from: "2022-03-01",
        date_to: "2024-08-31",
        description: "Insurance policy management platform. Greenfield development of a modern web application for managing commercial insurance policies, claims processing, and agent portal.",
        contribution: [
          "Developed React frontend with Carbon Design System components for agent-facing portal",
          "Built REST APIs in Spring Boot for policy lifecycle management",
          "Implemented PostgreSQL database schema supporting 500K+ policy records",
          "Set up CI/CD pipeline using Jenkins and Docker on IBM Cloud",
        ],
      },
    ],
    work_experience: [
      {
        role_title: "Software Engineer",
        company_name: "Ericsson Nikola Tesla",
        location: "Zagreb, Croatia",
        date_from: "2018-06-01",
        date_to: "2022-02-28",
        description: "Developed telecommunications network management tools using Java and Angular. Contributed to OSS/BSS integration platforms serving 15M+ subscribers.",
      },
    ],
    industry_experience: [
      { industry: "Financial Markets", proficiency: "Experienced" },
      { industry: "Insurance", proficiency: "Experienced" },
      { industry: "Telecommunications", proficiency: "Knowledgeable" },
    ],
    education: [
      {
        degree_title: "Master of Science in Computer Science",
        institution: "University of Zagreb, Faculty of Electrical Engineering and Computing (FER)",
        country: "HR",
        graduation_year: 2018,
        specialization: "Software Engineering and Information Systems",
      },
    ],
    languages: [
      { language: "English", spoken_proficiency: "Fluent", written_proficiency: "Fluent" },
      { language: "Croatian", spoken_proficiency: "Fluent", written_proficiency: "Fluent" },
      { language: "German", spoken_proficiency: "Basic", written_proficiency: "Basic" },
    ],
  },
  {
    serial: "IBM002",
    cv_language: "EN-GB",
    cv_updated_at: "2026-04-20",
    overview: "Data Scientist and AI Engineer with 5+ years of experience building machine learning solutions for enterprise clients. Specialised in natural language processing, predictive analytics, and IBM watsonx platform. Experienced in end-to-end ML pipeline development from data exploration through model deployment and monitoring. Strong background in statistical analysis, Python ecosystem, and cloud-based ML platforms. Passionate about applying responsible AI practices and IBM's AI ethics guidelines to all projects.",
    key_skills: {
      backend: ["Python", "FastAPI", "Flask", "SQL", "PySpark"],
      frontend: [],
      cloud: ["IBM watsonx", "IBM Cloud Pak for Data", "Google Cloud AI Platform"],
      other: ["Machine Learning", "NLP", "Deep Learning", "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "MLOps", "Responsible AI"],
    },
    digital_credentials: [
      { name: "IBM watsonx Essentials", year: 2025 },
      { name: "IBM Data Science Professional", year: 2024 },
      { name: "Google Cloud Professional Data Engineer", year: 2023 },
    ],
    ibm_assignments: [
      {
        role_title: "Data Scientist",
        client_name: "DEUTSCHE TELEKOM",
        location: "Bonn, Germany (Remote from Zagreb)",
        date_from: "2024-01-15",
        date_to: "2026-05-31",
        description: "Customer churn prediction and recommendation engine for B2B telecommunications services. Developed ML models to predict customer churn with 92% accuracy and recommend targeted retention offers.",
        contribution: [
          "Built churn prediction model using gradient boosting achieving 92% AUC-ROC",
          "Developed NLP pipeline for analyzing customer support ticket sentiment",
          "Deployed models on IBM Cloud Pak for Data with automated retraining pipeline",
          "Created executive dashboards in Cognos Analytics for business stakeholders",
        ],
      },
    ],
    work_experience: [
      {
        role_title: "Junior Data Analyst",
        company_name: "Infobip",
        location: "Zagreb, Croatia",
        date_from: "2020-09-01",
        date_to: "2023-12-31",
        description: "Analysed messaging platform performance data, built A/B testing frameworks, and developed automated reporting dashboards for product teams.",
      },
    ],
    industry_experience: [
      { industry: "Telecommunications", proficiency: "Experienced" },
      { industry: "Financial Markets", proficiency: "Knowledgeable" },
    ],
    education: [
      {
        degree_title: "Master of Science in Data Science",
        institution: "University of Zagreb, Faculty of Science",
        country: "HR",
        graduation_year: 2020,
        specialization: "Machine Learning and Statistical Modelling",
      },
    ],
    languages: [
      { language: "English", spoken_proficiency: "Fluent", written_proficiency: "Fluent" },
      { language: "Croatian", spoken_proficiency: "Fluent", written_proficiency: "Fluent" },
    ],
  },
  {
    serial: "IBM003",
    cv_language: "EN-GB",
    cv_updated_at: "2026-05-01",
    overview: "DevOps Engineer and Infrastructure Specialist with 6+ years of experience in cloud-native infrastructure, container orchestration, and CI/CD pipeline design. Deep expertise in Red Hat OpenShift, Kubernetes, and IBM Cloud. Certified in both Red Hat and CNCF ecosystems. Experienced in implementing GitOps workflows, infrastructure-as-code with Terraform, and building observability platforms. Strong focus on security-first DevOps practices and compliance automation.",
    key_skills: {
      backend: ["Go", "Python", "Bash", "Ansible"],
      frontend: [],
      cloud: ["Red Hat OpenShift", "IBM Cloud", "Kubernetes", "Docker", "Terraform", "Helm", "ArgoCD"],
      other: ["CI/CD", "GitOps", "Prometheus", "Grafana", "ELK Stack", "Vault", "Infrastructure as Code"],
    },
    digital_credentials: [
      { name: "Kubernetes Application Developer (CKAD)", year: 2025 },
      { name: "Red Hat Certified OpenShift Administrator", year: 2024 },
      { name: "IBM Cloud Advocate", year: 2023 },
    ],
    ibm_assignments: [
      {
        role_title: "DevOps Engineer",
        client_name: "RAIFFEISEN BANK INTERNATIONAL",
        location: "Vienna, Austria (Remote from Zagreb)",
        date_from: "2023-06-01",
        date_to: "2026-04-30",
        description: "Cloud platform modernisation for core banking services. Built and managed OpenShift-based container platform supporting 40+ microservices across development, staging, and production environments.",
        contribution: [
          "Designed and implemented multi-cluster OpenShift topology across 3 availability zones",
          "Built GitOps deployment pipeline using ArgoCD reducing deployment time from 2 hours to 15 minutes",
          "Implemented centralized logging and monitoring using ELK Stack and Prometheus/Grafana",
          "Automated security compliance checks using OPA/Gatekeeper policies",
        ],
      },
    ],
    work_experience: [
      {
        role_title: "Systems Administrator",
        company_name: "KING ICT",
        location: "Zagreb, Croatia",
        date_from: "2019-03-01",
        date_to: "2023-05-31",
        description: "Managed Linux infrastructure and VMware environments for government and enterprise clients. Transitioned on-premise workloads to hybrid cloud deployments.",
      },
    ],
    industry_experience: [
      { industry: "Banking", proficiency: "Experienced" },
      { industry: "Government", proficiency: "Knowledgeable" },
    ],
    education: [
      {
        degree_title: "Bachelor of Science in Information Technology",
        institution: "University of Zagreb, Faculty of Electrical Engineering and Computing (FER)",
        country: "HR",
        graduation_year: 2019,
        specialization: "Computer Engineering",
      },
    ],
    languages: [
      { language: "English", spoken_proficiency: "Fluent", written_proficiency: "Fluent" },
      { language: "Croatian", spoken_proficiency: "Fluent", written_proficiency: "Fluent" },
      { language: "German", spoken_proficiency: "Professional", written_proficiency: "Professional" },
    ],
  },
  {
    serial: "IBM004",
    cv_language: "EN-GB",
    cv_updated_at: "2026-03-10",
    overview: "Cybersecurity Consultant with 7+ years of experience in application security, cloud security architecture, and compliance frameworks. Specialised in security assessments, penetration testing coordination, and implementing zero-trust architectures for enterprise clients. Deep knowledge of OWASP, NIST, and ISO 27001 frameworks. Experienced in securing hybrid cloud environments and containerized workloads.",
    key_skills: {
      backend: ["Python", "Java", "Bash"],
      frontend: [],
      cloud: ["IBM Cloud Security", "AWS Security Hub", "Azure Sentinel"],
      other: ["OWASP Top 10", "Zero Trust Architecture", "SIEM", "IAM", "Penetration Testing", "ISO 27001", "NIST CSF", "SOC 2"],
    },
    digital_credentials: [
      { name: "CompTIA Security+", year: 2024 },
      { name: "Certified Ethical Hacker (CEH)", year: 2023 },
      { name: "IBM Cybersecurity Analyst", year: 2022 },
    ],
    ibm_assignments: [
      {
        role_title: "Security Consultant",
        client_name: "CROATIA OSIGURANJE",
        location: "Zagreb, Croatia",
        date_from: "2024-02-01",
        date_to: "2026-06-15",
        description: "Enterprise security transformation programme. Conducted comprehensive security assessment and implemented zero-trust architecture for the largest Croatian insurance company.",
        contribution: [
          "Led security architecture review identifying 47 critical vulnerabilities in legacy systems",
          "Designed and implemented zero-trust network architecture using micro-segmentation",
          "Established security operations centre (SOC) with 24/7 monitoring using IBM QRadar",
          "Developed security awareness training programme for 2000+ employees",
        ],
      },
    ],
    work_experience: [
      {
        role_title: "Security Analyst",
        company_name: "CARNET",
        location: "Zagreb, Croatia",
        date_from: "2019-01-01",
        date_to: "2024-01-31",
        description: "Monitored and responded to cybersecurity incidents for Croatian academic and research network. Developed threat intelligence reports and coordinated vulnerability disclosure.",
      },
    ],
    industry_experience: [
      { industry: "Insurance", proficiency: "Experienced" },
      { industry: "Government", proficiency: "Knowledgeable" },
      { industry: "Education", proficiency: "Knowledgeable" },
    ],
    education: [
      {
        degree_title: "Master of Science in Information Security",
        institution: "University of Zagreb, Faculty of Electrical Engineering and Computing (FER)",
        country: "HR",
        graduation_year: 2019,
        specialization: "Network Security and Cryptography",
      },
    ],
    languages: [
      { language: "English", spoken_proficiency: "Fluent", written_proficiency: "Fluent" },
      { language: "Croatian", spoken_proficiency: "Fluent", written_proficiency: "Fluent" },
    ],
  },
  {
    serial: "IBM005",
    cv_language: "EN-GB",
    cv_updated_at: "2026-04-05",
    overview: "Business Analyst and SAP Functional Consultant with 6+ years of experience in enterprise transformation projects. Specialised in SAP S/4HANA implementations, business process reengineering, and requirements management. Strong background in financial services and manufacturing sectors. Experienced in bridging the gap between business stakeholders and technical teams using IBM Garage methodology.",
    key_skills: {
      backend: ["SQL", "ABAP (Basic)"],
      frontend: [],
      cloud: ["SAP S/4HANA Cloud", "SAP BTP"],
      other: ["Business Analysis", "SAP FI/CO", "SAP MM", "Requirements Engineering", "BPMN", "IBM Garage", "Stakeholder Management", "Agile/Scrum"],
    },
    digital_credentials: [
      { name: "SAP Certified Application Associate – SAP S/4HANA", year: 2025 },
      { name: "IBM Business Analyst", year: 2024 },
      { name: "ITIL 4 Foundation", year: 2023 },
    ],
    ibm_assignments: [
      {
        role_title: "Business Analyst / SAP Consultant",
        client_name: "PLIVA (TEVA)",
        location: "Zagreb, Croatia",
        date_from: "2023-09-01",
        date_to: "2026-05-31",
        description: "SAP S/4HANA migration for pharmaceutical manufacturing. Led business analysis workstream for finance and procurement modules, managing requirements for 15+ business units across Central Europe.",
        contribution: [
          "Gathered and documented 200+ functional requirements across FI/CO and MM modules",
          "Facilitated 40+ workshops with business stakeholders across 5 countries",
          "Designed to-be business processes using BPMN notation for procurement workflows",
          "Managed UAT coordination for 3 release cycles with 150+ test scenarios",
        ],
      },
    ],
    work_experience: [
      {
        role_title: "Business Process Analyst",
        company_name: "Deloitte Croatia",
        location: "Zagreb, Croatia",
        date_from: "2020-01-01",
        date_to: "2023-08-31",
        description: "Supported SAP implementation projects for manufacturing and retail clients. Conducted gap analyses, documented business requirements, and coordinated testing activities.",
      },
    ],
    industry_experience: [
      { industry: "Manufacturing", proficiency: "Experienced" },
      { industry: "Pharmaceutical", proficiency: "Experienced" },
      { industry: "Retail", proficiency: "Knowledgeable" },
    ],
    education: [
      {
        degree_title: "Master of Business Administration",
        institution: "Zagreb School of Economics and Management (ZSEM)",
        country: "HR",
        graduation_year: 2020,
        specialization: "Information Management",
      },
    ],
    languages: [
      { language: "English", spoken_proficiency: "Fluent", written_proficiency: "Fluent" },
      { language: "Croatian", spoken_proficiency: "Fluent", written_proficiency: "Fluent" },
      { language: "German", spoken_proficiency: "Professional", written_proficiency: "Professional" },
    ],
  },
  {
    serial: "IBM007",
    cv_language: "EN-GB",
    cv_updated_at: "2026-05-20",
    overview: "Java Full Stack Developer with 5+ years of experience delivering enterprise web applications. Expert in J2EE, Spring Boot, and modern frontend technologies. Strong background in building RESTful microservices, implementing OAuth/JWT security, and working with relational databases. Experienced in agile delivery within large-scale IBM consulting engagements across banking and insurance sectors.",
    key_skills: {
      backend: ["Java", "J2EE", "Spring Boot", "Spring Security", "JAX-RS", "Hibernate", "PostgreSQL", "Oracle DB", "Kafka", "RabbitMQ"],
      frontend: ["Angular", "TypeScript", "HTML/CSS"],
      cloud: ["Docker", "Kubernetes", "IBM Cloud", "Jenkins"],
      other: ["Microservices", "REST APIs", "OAuth 2.0", "JWT", "Agile/Scrum", "JUnit", "Mockito"],
    },
    digital_credentials: [
      { name: "Oracle Certified Professional Java SE 17", year: 2025 },
      { name: "Spring Professional Certification", year: 2024 },
      { name: "IBM Java Full Stack Developer", year: 2023 },
    ],
    ibm_assignments: [
      {
        role_title: "Application Developer",
        client_name: "AXIS BANK",
        location: "Mumbai, India",
        date_from: "2024-03-01",
        date_to: "2026-05-15",
        description: "Digital banking platform development. Built microservices for customer onboarding, KYC verification, and transaction processing handling 100K+ daily transactions.",
        contribution: [
          "Developed 8 Spring Boot microservices for the customer onboarding journey",
          "Implemented OAuth 2.0 / OpenID Connect authentication with multi-factor support",
          "Built real-time transaction notification system using Kafka and WebSockets",
          "Achieved 99.9% uptime SLA through circuit breaker patterns and health check endpoints",
        ],
      },
    ],
    work_experience: [
      {
        role_title: "Java Developer",
        company_name: "Wipro Technologies",
        location: "Bangalore, India",
        date_from: "2021-06-01",
        date_to: "2024-02-28",
        description: "Developed and maintained enterprise Java applications for banking clients. Worked on payment gateway integrations and batch processing systems.",
      },
    ],
    industry_experience: [
      { industry: "Banking", proficiency: "Experienced" },
      { industry: "Insurance", proficiency: "Knowledgeable" },
    ],
    education: [
      {
        degree_title: "Bachelor of Technology in Computer Science",
        institution: "National Institute of Technology Karnataka",
        country: "IN",
        graduation_year: 2021,
        specialization: "Computer Science and Engineering",
      },
    ],
    languages: [
      { language: "English", spoken_proficiency: "Fluent", written_proficiency: "Fluent" },
      { language: "Hindi", spoken_proficiency: "Fluent", written_proficiency: "Fluent" },
    ],
  },
  {
    serial: "IBM011",
    cv_language: "EN-GB",
    cv_updated_at: "2026-05-10",
    overview: "Frontend Developer and UX Engineer with 4+ years of experience building enterprise web interfaces using React, Carbon Design System, and modern TypeScript. Passionate about accessibility, responsive design, and design systems. Experienced in collaborating with IBM Design teams to deliver pixel-perfect implementations of complex data-heavy enterprise UIs.",
    key_skills: {
      backend: ["Node.js", "Express", "REST APIs"],
      frontend: ["React", "TypeScript", "Carbon Design System", "Next.js", "Storybook", "CSS-in-JS", "SCSS", "Webpack", "Vite"],
      cloud: ["Vercel", "IBM Cloud", "Docker"],
      other: ["Accessibility (WCAG 2.1)", "Design Systems", "Figma", "Responsive Design", "Performance Optimisation"],
    },
    digital_credentials: [
      { name: "IBM Carbon Design System Contributor", year: 2025 },
      { name: "Meta Front-End Developer Professional", year: 2024 },
      { name: "IBM Frontend Developer", year: 2023 },
    ],
    ibm_assignments: [
      {
        role_title: "Frontend Developer",
        client_name: "EUROPEAN INVESTMENT BANK",
        location: "Luxembourg (Remote from Zagreb)",
        date_from: "2024-06-01",
        date_to: "2026-04-30",
        description: "Investment portfolio management dashboard. Built React-based analytics dashboard for portfolio managers with real-time data visualisation, complex filtering, and export capabilities.",
        contribution: [
          "Developed 25+ Carbon-based UI components for the portfolio analytics dashboard",
          "Implemented virtualized data tables handling 100K+ rows with sub-second rendering",
          "Built accessibility-first design achieving WCAG 2.1 AA compliance",
          "Created Storybook documentation for the project's component library",
        ],
      },
    ],
    work_experience: [
      {
        role_title: "Web Developer",
        company_name: "Nanobit (Stillfront Group)",
        location: "Zagreb, Croatia",
        date_from: "2021-09-01",
        date_to: "2024-05-31",
        description: "Developed web-based game management tools and admin dashboards using React and TypeScript. Built real-time analytics visualisations for game performance metrics.",
      },
    ],
    industry_experience: [
      { industry: "Financial Markets", proficiency: "Experienced" },
      { industry: "Gaming", proficiency: "Knowledgeable" },
    ],
    education: [
      {
        degree_title: "Bachelor of Science in Software Engineering",
        institution: "University of Zagreb, Faculty of Electrical Engineering and Computing (FER)",
        country: "HR",
        graduation_year: 2021,
        specialization: "Software Engineering",
      },
    ],
    languages: [
      { language: "English", spoken_proficiency: "Fluent", written_proficiency: "Fluent" },
      { language: "Croatian", spoken_proficiency: "Fluent", written_proficiency: "Fluent" },
      { language: "French", spoken_proficiency: "Basic", written_proficiency: "Basic" },
    ],
  },
  {
    serial: "IBM013",
    cv_language: "EN-GB",
    cv_updated_at: "2026-04-28",
    overview: "Strategy and Change Consultant with 9+ years of experience advising FTSE 100 and Fortune 500 clients on digital transformation, operating model redesign, and technology adoption. TOGAF certified enterprise architect with deep experience in financial services. Expert in stakeholder management, executive communication, and change management methodologies.",
    key_skills: {
      backend: [],
      frontend: [],
      cloud: [],
      other: ["Digital Transformation Strategy", "Operating Model Design", "Enterprise Architecture (TOGAF)", "Change Management (Prosci)", "Business Case Development", "Stakeholder Management", "Executive Presentations", "IBM Garage"],
    },
    digital_credentials: [
      { name: "TOGAF 9 Certified", year: 2024 },
      { name: "Prosci Change Management Certification", year: 2023 },
      { name: "IBM Strategy & Change Consultant", year: 2023 },
    ],
    ibm_assignments: [
      {
        role_title: "Strategy Consultant",
        client_name: "LLOYDS BANKING GROUP",
        location: "London, UK",
        date_from: "2024-01-15",
        date_to: "2026-06-30",
        description: "Enterprise-wide digital transformation programme. Advised C-suite on technology modernisation roadmap, defined target operating model for digital channels, and led change management workstream across 5 business divisions.",
        contribution: [
          "Developed 3-year digital transformation roadmap approved by Group CIO and Board",
          "Designed target operating model for digital-first customer engagement reducing operational costs by 30%",
          "Led change management programme impacting 8,000+ employees across 5 divisions",
          "Facilitated 20+ executive workshops using IBM Garage methodology",
        ],
      },
    ],
    work_experience: [
      {
        role_title: "Management Consultant",
        company_name: "Accenture",
        location: "London, UK",
        date_from: "2017-09-01",
        date_to: "2023-12-31",
        description: "Advised financial services and insurance clients on digital strategy, operating model transformation, and technology adoption. Led cross-functional teams of 10-25 consultants on transformation programmes.",
      },
    ],
    industry_experience: [
      { industry: "Banking", proficiency: "Expert" },
      { industry: "Insurance", proficiency: "Experienced" },
      { industry: "Capital Markets", proficiency: "Knowledgeable" },
    ],
    education: [
      {
        degree_title: "Master of Business Administration",
        institution: "London Business School",
        country: "GB",
        graduation_year: 2017,
        specialization: "Strategy and Finance",
      },
      {
        degree_title: "Bachelor of Arts in Economics",
        institution: "University of Cambridge",
        country: "GB",
        graduation_year: 2014,
        specialization: "Economics",
      },
    ],
    languages: [
      { language: "English", spoken_proficiency: "Fluent", written_proficiency: "Fluent" },
      { language: "French", spoken_proficiency: "Professional", written_proficiency: "Professional" },
    ],
  },
];
