// Starter posts shown until Supabase is connected (and seeded into the local demo admin).
// Once the database is configured, write and publish posts from /admin.html instead.
export const STARTER_POSTS = [
  {
    id: 'starter-ai-faces',
    slug: 'explaining-ai-generated-face-detectors',
    title: 'Explaining what an AI-generated face detector actually looks at',
    excerpt: 'Comparing ViT, ResNet, FFT-ResNet, DANN and SimCLR on 140k faces — and why an AUC of 0.996 is only half the story without explainability.',
    tags: ['Computer Vision', 'XAI'],
    cover_url: null,
    published: true,
    created_at: '2025-11-18T09:00:00Z',
    updated_at: '2025-11-18T09:00:00Z',
    content: `Detecting synthetic faces is easy to *score* and hard to *trust*. On a 140k-image real-vs-fake dataset, several models clear 99% accuracy — so the interesting question becomes **why** they decide what they decide.

## The model line-up

- **ViT-Small** — patch attention, strongest overall
- **ResNet-18** — a solid convolutional baseline
- **FFT-ResNet** — the same backbone fed frequency-domain input, where GAN artifacts often hide
- **DANN** — domain-adversarial training for robustness to unseen generators
- **SimCLR** — self-supervised pre-training before fine-tuning

## Looking inside

Accuracy alone can hide shortcut learning. I used three lenses:

1. **Integrated Gradients** to attribute each prediction to input pixels
2. **Attention-map visualization** for the ViT
3. **Masking-effect analysis** — occlude regions and measure the drop in confidence

> A detector that only looks at the background is a detector waiting to fail on the next generator.

The best models focused on eyes, hair boundaries and skin texture — exactly where generators still leave traces.

\`\`\`python
ig = IntegratedGradients(model)
attr = ig.attribute(x, target=label, n_steps=64)
\`\`\`

Full code and notebooks are on [GitHub](https://github.com/Abrham-Assefa/Detecting-AI-Generated-Faces).`
  },
  {
    id: 'starter-asl',
    slug: 'real-time-asl-with-mediapipe-and-svm',
    title: 'Real-time ASL recognition with MediaPipe landmarks and a humble SVM',
    excerpt: 'Why 21 hand landmarks and a well-tuned SVM beat heavier models for live sign-language classification — 99.5% accuracy with SHAP explanations.',
    tags: ['Machine Learning', 'Computer Vision'],
    cover_url: null,
    published: true,
    created_at: '2025-09-02T09:00:00Z',
    updated_at: '2025-09-02T09:00:00Z',
    content: `You don't always need a deep network. For American Sign Language letters, **MediaPipe** already gives you 21 precise 3D hand landmarks per frame — a compact, lighting-robust feature vector.

## Pipeline

1. Extract landmarks with MediaPipe Hands
2. Normalize relative to the wrist and hand scale
3. Benchmark classical models with **GridSearchCV**
4. Explain the winner with **SHAP**

The **SVM** came out on top at **99.5% accuracy**, fast enough for real-time webcam inference on a laptop CPU.

## What SHAP showed

Fingertip distances and thumb position carried most of the signal, which matches how humans tell similar letters apart. The confusion matrix confirmed the remaining errors sit between visually similar signs.

Code: [ASL-HAND-SIGN-CLASSIFICATION](https://github.com/Abrham-Assefa/ASL-HAND-SIGN-CLASSIFICATION).`
  },
  {
    id: 'starter-fullstack',
    slug: 'from-notebook-to-production',
    title: 'From notebook to production: lessons from shipping government and logistics apps',
    excerpt: 'What building Africa Urban Forum, a fleet dashboard and an INSA fuel-management system taught me about taking ideas past the prototype.',
    tags: ['Full-Stack', 'Career'],
    cover_url: null,
    published: true,
    created_at: '2025-06-10T09:00:00Z',
    updated_at: '2025-06-10T09:00:00Z',
    content: `Before my MSc in AI, I spent my days shipping real software — a government event site, a bus-fleet dashboard and an internal fuel-management system at INSA. A few lessons carried straight over to ML work.

## 1. Roles and permissions come first

Every serious dashboard ended up with multiple roles. Designing them early saved painful rewrites.

## 2. Reporting is the product

For the fuel system, card balances and totalizer reports *were* the value. Pretty UI mattered less than numbers people could trust.

## 3. Localization is not an afterthought

The fleet console needed language selection from day one — retrofitting it would have touched every screen.

## 4. Ship, measure, iterate

The same loop applies to models: a deployed 95% model teaches you more than a 99% notebook.

Want to build something together? [Get in touch](./#contact).`
  }
];
