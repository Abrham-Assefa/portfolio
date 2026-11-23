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
  },
  {
    id: 'starter-synthetic-data',
    slug: 'when-synthetic-data-helps-and-when-it-does-not',
    title: 'When synthetic data helps — and when it quietly makes your model worse',
    excerpt: 'A practical guide to using generated samples without amplifying the same biases, shortcuts and distribution gaps that caused the problem.',
    tags: ['Synthetic Data', 'Research'],
    cover_url: null,
    published: true,
    created_at: '2026-10-28T09:00:00Z',
    updated_at: '2026-10-28T09:00:00Z',
    content: `Synthetic data is most useful when it fills a clearly measured gap, not when it becomes an undifferentiated pile of additional samples.

## Start with the gap

Before generating anything, compare the real training, validation and deployment distributions. Look at metadata, class counts, difficult cases and rare combinations. The missing slice should be specific: underrepresented lighting, camera noise, pose, language, season or user behavior.

## Mix real and synthetic samples carefully

A useful first experiment is to hold the real validation set fixed and vary only the proportion of generated samples. Plot calibration and minority-slice performance, not just overall accuracy.

\`\`\`python
ratios = [0.0, 0.25, 0.5, 0.75, 1.0]
for ratio in ratios:
  train = mix_real_and_synthetic(real, synthetic, ratio)
  evaluate(train, real_validation)
\`\`\`

## Red flags

- Generated samples dominate the validation distribution
- Quality filtering rejects almost every difficult sample
- Aggregate scores improve while rare groups regress
- The generator leaks labels or identifiers from the source set

> Synthetic data should widen the training distribution, not smooth away the moments that make it difficult.`
  },
  {
    id: 'starter-rag-eval',
    slug: 'evaluating-rag-beyond-answer-quality',
    title: 'Evaluating RAG systems beyond “does the answer sound right?”',
    excerpt: 'A compact evaluation stack for retrieval recall, citation faithfulness, latency and refusal behavior in retrieval-augmented applications.',
    tags: ['LLM', 'Evaluation'],
    cover_url: null,
    published: true,
    created_at: '2026-09-21T09:00:00Z',
    updated_at: '2026-09-21T09:00:00Z',
    content: `The most expensive RAG failure is not a rude answer — it is a confident answer built from the wrong evidence. Answer quality is only one slice of the system.

## Measure retrieval first

Create a golden set containing the query, relevant document IDs and one or more expected facts. Then measure:

- **Recall@k**: did the correct source reach the context window?
- **MRR**: how early did it appear?
- **Retrieval precision**: how much of the context was relevant?

## Then measure generation

For each response, record:

1. Whether every factual claim is supported by retrieved evidence
2. Whether the response cites the right source
3. Whether it admits uncertainty when evidence is missing
4. Latency and token cost at each retrieval depth

## Build slices, not one leaderboard

Separate short factual questions, multi-hop questions, ambiguous queries and requests for missing information. A query that is “good overall” can still hide a broken edge.

\`\`\`python
score = {
  "retrieval_recall": recall_at_k(golden, k=5),
  "supported_claim_rate": supported_claims / total_claims,
  "refusal_precision": correct_refusals / total_refusals,
}
\`\`\`

The goal is not a single green metric. It is a dashboard that tells you whether to repair chunking, retrieval, prompting or the source data.`
  },
  {
    id: 'starter-model-monitoring',
    slug: 'small-monitoring-stack-for-ml',
    title: 'A small monitoring stack that catches ML regressions early',
    excerpt: 'The lightweight signals I add before a model reaches production: drift, slice reports, calibration checks and explicit business metrics.',
    tags: ['MLOps', 'Monitoring'],
    cover_url: null,
    published: true,
    created_at: '2026-08-14T09:00:00Z',
    updated_at: '2026-08-14T09:00:00Z',
    content: `Production monitoring is most useful when it is boring, repeatable and connected to decisions. A useful baseline needs much less infrastructure than a model-card-shaped dashboard.

## Start with four signal groups

- **Data health**: missing values, type shifts and impossible ranges
- **Distribution drift**: PSI or Kolmogorov–Smirnov checks for high-volume features
- **Model health**: prediction confidence, calibration and error rate
- **Product health**: completion, acceptance, revenue or the metric the model is meant to improve

## Automate thresholds

Avoid a threshold for every possible column. First warn for broad changes, then drill into the specific feature or slice that moved.

\`\`\`python
report = monitoring_report(
  baseline=training_reference,
  current=production_batch,
  alert_threshold=0.05,
)
\`\`\`

## Every alert needs an owner

An alert is incomplete unless it answers:

1. What changed?
2. Is the change data, model or user behavior?
3. Who investigates first?
4. What action follows: retrain, rollback, annotate or pause?

The best monitor is one that helps the team make a bounded decision quickly, rather than generate a prettier chart.`
  },
  {
    id: 'starter-contrastive-learning',
    slug: 'contrastive-learning-with-small-batches',
    title: 'Making contrastive learning work with small batches',
    excerpt: 'Notes on augmentations, projection heads, temperature and validation protocols for low-resource contrastive experiments.',
    tags: ['Deep Learning', 'Computer Vision'],
    cover_url: null,
    published: true,
    created_at: '2026-07-02T09:00:00Z',
    updated_at: '2026-07-02T09:00:00Z',
    content: `Contrastive learning can extract useful structure before labeled examples arrive, but it is easy to make the task too easy or too hard.

## Augmentation is supervision

Your augmentation defines what should stay invariant. For faces, strong pose or identity-changing transforms can create a mixed signal. For documents, aggressive crop or blur may destroy the text that defines the task.

I recommend starting with a small, explicit augmentation grid:

- mild and strong geometric transforms
- color changes
- noise and blur
- crop scale
- modality-specific perturbations

## Temperature matters

The temperature in an NT-Xent or InfoNCE objective controls how hard negatives are treated. A low temperature can make training sensitive to individual pairs, while a high temperature produces a softer objective.

## Validate the representation, not the pretext loss

Track a downstream linear probe on a fixed labeled split. Plot the pretext loss and k-NN retrieval, but do not let them decide the run winner alone.

\`\`\`python
representation = backbone(x)
projection = projection_head(representation)
loss = nt_xent(projection)
\`\`\`

With limited memory, repeated augmentations, queue-based negatives and gradient accumulation can be more informative than repeatedly increasing the batch size.`
  },
  {
    id: 'starter-xai-checklist',
    slug: 'explainability-checklist',
    title: 'An explainability checklist before you ship an XAI feature',
    excerpt: 'How to test whether an explanation is faithful, understandable and useful — instead of simply making a model output look reassuring.',
    tags: ['Explainable AI', 'Research'],
    cover_url: null,
    published: true,
    created_at: '2026-05-19T09:00:00Z',
    updated_at: '2026-05-19T09:00:00Z',
    content: `An explanation is not automatically an answer. It is a representation of part of a model's behavior, optimized for a different user need.

## Three questions

### Faithful?

Does the explanation reflect the model behavior rather than a familiar post hoc story? Use perturbation tests and compare against a baseline.

### Understandable?

Can the intended user interpret it without prior ML knowledge? Test language, color, units and the difference between local and global evidence.

### Useful?

Does the explanation change a real decision in the right way? A technically correct heatmap can still fail to help a clinician, reviewer or analyst.

## Minimum feature checks

- Cover positive and negative examples
- Include a confidence or uncertainty indicator
- State when the model is outside its expected domain
- Avoid causal language unless causality was established
- Give users a route to inspect or override the result

> A polished explanation can increase trust even when it reduces understanding. Test the result, not the presentation.`
  },
  {
    id: 'starter-computer-vision-data',
    slug: 'computer-vision-dataset-audit',
    title: 'A 30-minute dataset audit for computer vision projects',
    excerpt: 'A fast pass that finds duplicate images, label drift, hidden splits and examples likely to fail after deployment.',
    tags: ['Computer Vision', 'Data Quality'],
    cover_url: null,
    published: true,
    created_at: '2026-04-08T09:00:00Z',
    updated_at: '2026-04-08T09:00:00Z',
    content: `A dataset audit does not require an expensive annotation sprint. It can begin with a fixed set of queries that expose common failure modes.

## 1. Find near-duplicates

Hash exact duplicates and embeddings for near-duplicates. Remove leakage between train, validation and test splits before measuring accuracy.

## 2. Review the label boundary

Sample classes and mixed pairs. For every class, identify ambiguous examples and write down which rule annotators should follow.

## 3. Visualize failures

Build a contact sheet of false positives and false negatives. Group it by lighting, crop, object size and image source.

## 4. Find the easy and hard subsets

Train a baseline, rank uncertain examples and inspect both extremes. The lowest-confidence examples often reveal the most important label or data issue.

\`\`\`python
duplicates = find_near_duplicates(image_embeddings, threshold=0.98)
leaks = duplicate_ids_across_splits(duplicates, splits)
\`\`\`

The output should be a small set of concrete actions: relabel, deduplicate, add examples or redesign the task.`
  },
  {
    id: 'starter-prompt-regression',
    slug: 'prompt-regression-tests',
    title: 'Prompt regression tests: from manual demos to repeatable checks',
    excerpt: 'How to turn fragile prompt demonstrations into a small suite covering task completion, format, safety and cost.',
    tags: ['LLM', 'Testing'],
    cover_url: null,
    published: true,
    created_at: '2026-03-12T09:00:00Z',
    updated_at: '2026-03-12T09:00:00Z',
    content: `A prompt that works in five demos may fail in the hundredth real request. A regression suite makes prompt changes comparable.

## Choose a stable assertion set

Not every answer needs an exact match. Combine:

- exact format and schema checks
- key fact presence
- forbidden content checks
- grounded citation checks
- model-graded rubrics for open-ended tasks

## Separate functional and aesthetic cases

Keep a list of cases where the prompt must do a precise job, and another list where tone or style matters. This prevents a high-level quality score from hiding schema failures.

\`\`\`json
{
  "input": "Summarize the return policy",
  "must_include": ["14-day window", "original receipt"],
  "must_cite": true,
  "max_tokens": 180
}
\`\`\`

## Track cost as a test result

Record tokens, latency and retries for each scenario. An optimization that saves 30% but doubles edge-case failures is not a free win.

Run representative tests locally, but keep larger evaluation sets versioned alongside the prompt and application code.`
  },
  {
    id: 'starter-federated-learning',
    slug: 'federated-learning-field-notes',
    title: 'Federated learning field notes: the hard problems are outside the optimizer',
    excerpt: 'Practical observations about client heterogeneity, communication cost and system drift in distributed model training.',
    tags: ['Federated Learning', 'Distributed ML'],
    cover_url: null,
    published: true,
    created_at: '2026-02-06T09:00:00Z',
    updated_at: '2026-02-06T09:00:00Z',
    content: `Federated learning adds a coordination problem to every existing ML problem. The first model can be correct in simulation and still fail in an active network.

## Client heterogeneity

Different devices, locations and usage patterns do not produce interchangeable batches. Track update diversity and evaluate against region or device slices.

## Non-IID data

Local data is both unbalanced and unrepresentative. Average-by-weight is not always the right aggregation rule.

## Communication is a feature constraint

Compression, update frequency and retry behavior determine whether a system is practical. Start with the communication budget and work backward.

## Partial participation

Assume clients disappear. A round that needs every participant is not a robust protocol.

## System-level metrics

- number of usable clients per round
- update staleness
- convergence by client cohort
- bandwidth and battery impact
- fairness across participation levels

Before adding a more complex optimizer, simulate realistic arrival rates and dropped rounds. Many failures are coordination failures rather than training failures.`
  },
  {
    id: 'starter-multilingual-nlp',
    slug: 'multilingual-nlp-slice-checks',
    title: 'Five slice checks for multilingual NLP',
    excerpt: 'A compact framework for testing language coverage, script variation, code-switching and translation artifacts.',
    tags: ['NLP', 'Evaluation'],
    cover_url: null,
    published: true,
    created_at: '2026-01-16T09:00:00Z',
    updated_at: '2026-01-16T09:00:00Z',
    content: `A multilingual average hides two kinds of risk: poor coverage and uneven quality inside a language.

## 1. Language and script

Report performance by language and script. A system may handle Latin-script text well while failing for the same language in an alternate script.

## 2. Register and domain

Separate formal, conversational, technical and user-generated text. Training on news does not guarantee good social chat behavior.

## 3. Code-switching

Include sentences that mix languages. Mixed-sentence results often expose tokenizer and intent-routing failures.

## 4. Translation artifacts

Machine-translated test sets can be useful, but they inherit translator patterns. Keep a native-source holdout whenever possible.

## 5. Dialect and orthography

Measure spelling variation and dialect-specific expressions. Character-level robustness may matter more for some languages than rare-word embeddings.

\`\`\`python
slices = ["language", "script", "register", "domain", "code_switch"]
report = evaluate_by_slices(predictions, gold, slices)
\`\`\`

Aggregate only after the slices have been reviewed. The goal is to find where support stops, not to manufacture an impressive global number.`
  },
  {
    id: 'starter-ml-system-design',
    slug: 'reverse-engineer-ml-system-design',
    title: 'Reverse-engineering a machine learning system before writing code',
    excerpt: 'A first-pass system-design worksheet for data flow, latency budgets, fallback behavior and ownership.',
    tags: ['System Design', 'MLOps'],
    cover_url: null,
    published: true,
    created_at: '2025-12-18T09:00:00Z',
    updated_at: '2025-12-18T09:00:00Z',
    content: `The fastest way to avoid a beautiful but unusable ML system is to describe its data and failure behavior before choosing the model.

## Write down the request

- What input arrives?
- Who provides it?
- How old can it be?
- What is the service-level target?
- How is the result consumed?

## Draw the data flow

Include feature creation, model serving, post-processing and feedback capture. A missing storage or ownership line becomes a production incident later.

## Choose a latency budget

Separate the time available for preprocessing, inference, retrieval and network transfer. This determines whether a batch, cache or distilled model is appropriate.

## Define no-confidence behavior

The system needs a fallback:

- return the result with a warning
- route to a rule or human
- deny the request
- use a previous answer only under explicit policy

## Assign every component an owner

Data quality, feature pipelines, model quality and application behavior can belong to different teams. Silent ownership gaps cause most cross-service regressions.

Only after these decisions should the experiment optimize accuracy or a benchmark score.`
  },
  {
    id: 'starter-learning-from-errors',
    slug: 'learning-from-model-errors',
    title: 'Learning from model errors is more useful than collecting more metrics',
    excerpt: 'A simple error-analysis loop for turning missed cases into labels, features and better evaluation sets.',
    tags: ['Machine Learning', 'Research'],
    cover_url: null,
    published: true,
    created_at: '2025-10-26T09:00:00Z',
    updated_at: '2025-10-26T09:00:00Z',
    content: `A perfect-looking confusion matrix can hide the one pattern the team needs to understand most. Error analysis closes that gap.

## Start with a manageable sample

Sort failures by impact and confidence, then inspect 30–50 examples. The goal is to identify reusable themes, not to reach subjective consensus on every point.

## Label the error, not just the sample

Examples of useful analysis dimensions:

- ambiguous ground truth
- wrong or missing feature
- distribution shift
- adversarial or difficult input
- downstream formatting bug
- user context not available to the model

## Turn themes into artifacts

Every theme should produce at least one of:

1. a revised annotation rule
2. a new regression test
3. a targeted data-collection slice
4. a product fallback
5. a model or feature change

## Re-run the same audit

Keep the original examples fixed across iterations. If a team only inspects fresh failures, it may create the illusion of progress.

Good error analysis leaves the system more observable, not merely more accurate.`
  }
];
