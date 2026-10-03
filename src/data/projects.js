// cats: cv = Computer Vision, ml = Machine Learning, app = Web & Mobile
export const projects = [
  {
    slug: 'ai-generated-faces',
    title: 'Detecting AI-Generated Faces',
    label: 'Computer Vision · XAI',
    metric: 'AUC 0.996',
    cats: ['cv'],
    desc: 'Distinguishing real from synthetic faces on a 140k-image dataset. ViT-Small, ResNet-18, FFT-ResNet, DANN and SimCLR compared, with a full explainability layer — Integrated Gradients, attention-map visualization, and masking-effect analysis.',
    highlights: [
      '140k-image real vs. synthetic face dataset',
      'Compared ViT-Small, ResNet-18, FFT-ResNet, DANN (domain adaptation) and SimCLR (self-supervised)',
      'Explainability: Integrated Gradients, attention maps, masking-effect analysis',
      'Peak AUC of 0.996'
    ],
    tags: ['PyTorch', 'ViT', 'Grad-CAM', 'Jupyter'],
    links: [{ label: 'GitHub', href: 'https://github.com/Abrham-Assefa/Detecting-AI-Generated-Faces' }],
    featured: true
  },
  {
    slug: 'asl-hand-sign',
    title: 'ASL Hand Sign Classification',
    label: 'Machine Learning · CV',
    metric: '99.5% acc',
    cats: ['ml', 'cv'],
    desc: 'Real-time American Sign Language classifier using MediaPipe hand landmarks. Benchmarked SVM against multiple classical models, with GridSearch tuning, SHAP explanations, and confusion-matrix analysis; SVM was the top performer.',
    highlights: [
      'Real-time classification from MediaPipe hand landmarks',
      'SVM benchmarked against multiple classical models with GridSearch tuning',
      'SHAP explanations and confusion-matrix analysis',
      '99.5% accuracy with the best SVM'
    ],
    tags: ['MediaPipe', 'SVM', 'SHAP', 'scikit-learn'],
    links: [{ label: 'GitHub', href: 'https://github.com/Abrham-Assefa/ASL-HAND-SIGN-CLASSIFICATION' }],
    featured: true
  },
  {
    slug: 'traffic-sign',
    title: 'Traffic Sign Classification',
    label: 'Computer Vision',
    metric: 'Ensemble + TTA',
    cats: ['cv', 'ml'],
    desc: 'Autonomous-driving-oriented traffic sign recognition on GTSRB. Built both a classical pipeline (HOG features + SVM/KNN) and a deep learning pipeline (EfficientNetV2S with test-time augmentation and a weighted ensemble) for robustness under varying conditions.',
    highlights: [
      'GTSRB benchmark, autonomous-driving oriented',
      'Classical pipeline: HOG features + SVM / KNN',
      'Deep pipeline: EfficientNetV2S + test-time augmentation',
      'Weighted ensemble for robustness under varying conditions'
    ],
    tags: ['EfficientNetV2S', 'HOG', 'TTA'],
    links: [{ label: 'GitHub', href: 'https://github.com/Abrham-Assefa/Trafic-Light-Classfiaction-' }],
    featured: true
  },
  {
    slug: 'stock-liquidation',
    title: 'Optimal Stock Liquidation',
    label: 'AI & Finance',
    metric: 'RL + Stochastic Vol',
    cats: ['ml'],
    desc: 'Almgren-Chriss framework combined with Heston stochastic volatility to compare static vs. dynamic liquidation strategies, extended with tabular Q-Learning and SARSA reinforcement-learning agents in a self-contained research notebook.',
    highlights: [
      'Almgren-Chriss optimal execution framework',
      'Heston stochastic volatility price dynamics',
      'Static vs. dynamic liquidation strategy comparison',
      'Tabular Q-Learning and SARSA agents'
    ],
    tags: ['Reinforcement Learning', 'Quant Finance', 'Python'],
    links: [{ label: 'GitHub', href: 'https://github.com/Abrham-Assefa/AI-and-Finacee-project-' }],
    featured: true
  },
  {
    slug: 'deepfake-video',
    title: 'Deepfake Video Detection',
    label: 'Computer Vision · Video',
    metric: 'CNN + LSTM',
    cats: ['cv', 'ml'],
    desc: 'Hybrid ResNeXt50 + LSTM architecture trained on the Celeb-DF dataset to detect manipulated video content by combining frame-level spatial features with temporal sequence modeling.',
    highlights: [
      'ResNeXt50 frame-level spatial feature extractor',
      'LSTM temporal sequence modeling',
      'Trained on the Celeb-DF dataset'
    ],
    tags: ['ResNeXt50', 'LSTM', 'Celeb-DF'],
    links: [],
    note: 'Private repo'
  },
  {
    slug: 'knowledge-distillation',
    title: 'Knowledge Distillation Pipeline',
    label: 'Model Compression',
    metric: 'Teacher → Student',
    cats: ['ml'],
    desc: 'EfficientNet-B4 teacher distilled into EfficientNet-B1 and MobileNetV3 students on a plant-disease dataset, with training speed optimized via epoch reduction, batch-size tuning, early stopping, and automated dataset setup.',
    highlights: [
      'EfficientNet-B4 teacher → EfficientNet-B1 and MobileNetV3 students',
      'Plant-disease image dataset',
      'Faster training via epoch reduction, batch-size tuning and early stopping',
      'Automated dataset setup'
    ],
    tags: ['EfficientNet', 'MobileNetV3', 'Distillation'],
    links: [],
    note: 'Private repo'
  },
  {
    slug: 'africa-urban-forum',
    title: 'Africa Urban Forum',
    label: 'Web Development · Gov',
    metric: 'Live',
    cats: ['app'],
    desc: 'Official website for the Africa Urban Forum (AUF) 2024, an Ethiopian government initiative on sustainable urbanization under Agenda 2063 — event info, scholarship applications, and registration.',
    highlights: [
      'Official site for AUF 2024 (Agenda 2063 sustainable urbanization)',
      'Event information, scholarship applications and registration',
      'Responsive React front-end'
    ],
    tags: ['React', 'Government', 'Responsive'],
    links: [{ label: 'Live Site', href: 'https://auf.gov.et' }]
  },
  {
    slug: 'sirkuni',
    title: 'Sirkuni App',
    label: 'Mobile · Privacy',
    metric: 'Cross-platform',
    cats: ['app'],
    desc: 'A privacy-first messaging app built around a simple promise — "say anything, stay private, control time." Includes a marketing site and downloadable mobile client.',
    highlights: [
      'Privacy-first messaging: "say anything, stay private, control time"',
      'Cross-platform Flutter client with Firebase backend',
      'Marketing site and downloadable mobile app'
    ],
    tags: ['Flutter', 'Firebase', 'Privacy'],
    links: [],
    note: 'Client project'
  },
  {
    slug: 'fast-time-express',
    title: 'Fast Time Express',
    label: 'Full-Stack · Logistics',
    metric: 'Live',
    cats: ['app'],
    desc: 'A bus and fleet management dashboard for a transport company — multi-role sign-in, dispatch scheduling, and a language-selectable admin console.',
    highlights: [
      'Multi-role sign-in',
      'Dispatch scheduling for bus and fleet operations',
      'Language-selectable admin console'
    ],
    tags: ['Node.js', 'Dashboard', 'Multi-language'],
    links: [{ label: 'Live Site', href: 'http://busmanagement.fasttimeexpress.net' }]
  },
  {
    slug: 'nzk-fuel',
    title: 'NZk System — Fuel Management',
    label: 'Full-Stack · INSA',
    metric: 'Enterprise',
    cats: ['app'],
    desc: 'An internal fuel management and monitoring system built during my time at INSA — card balance tracking, registration records, and totalizer reporting dashboards.',
    highlights: [
      'Fuel card balance tracking',
      'Registration records management',
      'Totalizer reporting dashboards'
    ],
    tags: ['Node.js', 'Dashboard', 'Reporting'],
    links: [],
    note: 'Internal / INSA'
  },
  {
    slug: 'dmu-osc',
    title: 'DMU OSC — One Card System',
    label: 'Full-Stack · Campus',
    metric: 'Deployed',
    cats: ['app'],
    desc: 'A campus one-card system built for Debre Markos University, handling student ID issuance and record management for the whole student body.',
    highlights: [
      'Student ID issuance for the whole student body',
      'Centralized record management',
      'Deployed on campus'
    ],
    tags: ['Full-Stack', 'Campus IT', 'Records'],
    links: [],
    note: 'Deployed on campus'
  }
];

export const filters = [
  { id: 'all', label: 'All' },
  { id: 'cv', label: 'Computer Vision' },
  { id: 'ml', label: 'Machine Learning' },
  { id: 'app', label: 'Web & Mobile' }
];
