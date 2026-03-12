// src/pages/CourseDetail/courseData.js
// Реальные данные всех курсов: уроки с видео, слайды, описания

export const COURSES_DATA = {
  /* ══════════════════════════════════════════════════════════
     КУРС 1 — Algorithms & Data Structures
  ══════════════════════════════════════════════════════════ */
  1: {
    id: 1,
    title: "Algorithms & Data Structures",
    subtitle:
      "Deep-dive into CS fundamentals. Master arrays, trees, graphs, sorting, dynamic programming and more with real interview problems.",
    description: `This course is designed to take you from zero to hero in computer science fundamentals. Whether you're preparing for technical interviews at top companies or just want to write better, more efficient code — this is the course for you.\n\nWe cover everything from basic array manipulation to advanced dynamic programming patterns. Each concept is explained with visual animations, code walkthroughs, and real LeetCode-style problems.\n\nBy the end you'll be able to confidently solve algorithmic challenges and understand the trade-offs between different data structures.`,
    instructor: {
      name: "Andrew Clark",
      role: "Senior Engineer @ Google",
      avatar: "AC",
      rating: 4.9,
      students: 22400,
      courses: 8,
      bio: "Andrew has 12+ years of experience at Google working on core search infrastructure. He's interviewed 500+ candidates and knows exactly what top companies look for.",
    },
    rating: 4.9,
    reviewCount: 2240,
    students: 22400,
    duration: "50h",
    totalLessons: 14,
    level: "Advanced",
    lastUpdated: "March 2025",
    language: "English",
    price: 49,
    originalPrice: 127,
    thumb:
      "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=900&q=80",
    category: "Computer Science",
    tags: ["Algorithms", "Data Structures", "Interview Prep", "Python"],
    previewVideoId: "8hly31xKli0",
    whatYouLearn: [
      "Master Big-O notation and complexity analysis",
      "Implement all major data structures from scratch",
      "Solve 100+ LeetCode-style problems",
      "Ace technical interviews at top companies",
      "Understand dynamic programming patterns",
      "Graph algorithms: BFS, DFS, Dijkstra",
    ],
    curriculum: [
      {
        section: "Foundations",
        lessons: [
          {
            id: 1,
            title: "Course Overview & Setup",
            duration: "5:12",
            free: true,
            type: "video",
            videoId: "8hly31xKli0",
            description:
              "Welcome to the course! We set up our Python environment, go over the syllabus, and discuss what to expect throughout the journey.",
            slides: null,
          },
          {
            id: 2,
            title: "Big-O Notation Explained",
            duration: "18:40",
            free: true,
            type: "slides+video",
            videoId: "D6xkbGLQesk",
            description:
              "Learn how to analyze algorithm efficiency using Big-O notation. We cover O(1), O(n), O(log n), O(n²) with real code examples.",
            slides: [
              {
                title: "What is Big-O?",
                content:
                  "Big-O notation describes the **upper bound** of an algorithm's growth rate as input size **n** approaches infinity.\n\nIt ignores constants and lower-order terms — we only care about the dominant term.",
                code: null,
              },
              {
                title: "Common Complexities",
                content:
                  "From fastest to slowest:\n• **O(1)** — Constant: array index, hash lookup\n• **O(log n)** — Logarithmic: binary search\n• **O(n)** — Linear: single loop\n• **O(n log n)** — Merge sort, heap sort\n• **O(n²)** — Quadratic: nested loops\n• **O(2ⁿ)** — Exponential: recursive subsets",
                code: null,
              },
              {
                title: "Example: Linear Search O(n)",
                content:
                  "Searching through an array element by element. Worst case: check every element before finding target or concluding it doesn't exist.",
                code: "def linear_search(arr, target):\n    for i, val in enumerate(arr):\n        if val == target:\n            return i\n    return -1\n\n# Time:  O(n)\n# Space: O(1)",
              },
              {
                title: "Example: Binary Search O(log n)",
                content:
                  "Binary search halves the search space each step. Requires a **sorted** array. At each step we eliminate half the remaining candidates.",
                code: "def binary_search(arr, target):\n    lo, hi = 0, len(arr) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if arr[mid] == target:  return mid\n        elif arr[mid] < target: lo = mid + 1\n        else:                   hi = mid - 1\n    return -1\n\n# Time:  O(log n)\n# Space: O(1)",
              },
              {
                title: "Space Complexity",
                content:
                  "Big-O also applies to memory usage:\n\n• **O(1)** space — a few variables\n• **O(n)** space — an array proportional to input\n• **O(n²)** space — a 2D matrix\n\nAlways consider both time **and** space when analysing algorithms.",
                code: null,
              },
            ],
          },
          {
            id: 3,
            title: "Arrays & Dynamic Arrays",
            duration: "28:05",
            free: false,
            type: "slides",
            videoId: null,
            description:
              "Deep dive into arrays: memory layout, indexing, slicing. We implement a dynamic array (like Python list) from scratch with amortized O(1) append.",
            slides: [
              {
                title: "Static Arrays",
                content:
                  "A static array is a **contiguous block of memory** where each element occupies the same size.\n\n• Random access: **O(1)**\n• Insert at end: **O(1)** if space\n• Insert at middle: **O(n)** — must shift\n• Delete: **O(n)** — must shift",
                code: null,
              },
              {
                title: "Dynamic Array — Core Idea",
                content:
                  "When the array is **full**, allocate **2× space** and copy all elements. Although resize is O(n), amortised cost of append is still **O(1)**.",
                code: "class DynamicArray:\n    def __init__(self):\n        self._data = [None]  # internal buffer\n        self._size = 0       # logical size\n        self._cap  = 1       # buffer capacity\n\n    def __len__(self):  return self._size\n    def __getitem__(self, i): return self._data[i]",
              },
              {
                title: "Dynamic Array — Append & Resize",
                content:
                  "Append is O(1) amortised because we double capacity each time, so each element is moved at most twice over its lifetime.",
                code: "    def append(self, val):\n        if self._size == self._cap:\n            self._resize(2 * self._cap)\n        self._data[self._size] = val\n        self._size += 1\n\n    def _resize(self, new_cap):\n        new_buf = [None] * new_cap\n        for i in range(self._size):\n            new_buf[i] = self._data[i]\n        self._data = new_buf\n        self._cap  = new_cap",
              },
            ],
          },
          {
            id: 4,
            title: "Linked Lists",
            duration: "35:20",
            free: false,
            type: "slides",
            videoId: null,
            description:
              "Singly and doubly linked lists. When to use them vs arrays. Implement reverse, detect cycle, and merge sorted lists.",
            slides: [
              {
                title: "Linked List Basics",
                content:
                  "A linked list is a chain of **nodes**, each containing data and a pointer to the next node.\n\n**Pros:** O(1) insert/delete at head, no capacity limit\n**Cons:** O(n) random access, extra memory for pointers",
                code: "class Node:\n    def __init__(self, val):\n        self.val  = val\n        self.next = None\n\nclass LinkedList:\n    def __init__(self):\n        self.head = None\n        self.size = 0",
              },
              {
                title: "Reversing a Linked List",
                content:
                  "Classic interview problem. Use three pointers: **prev**, **curr**, **next**. Walk through once — O(n) time, O(1) space.",
                code: "def reverse(head):\n    prev, curr = None, head\n    while curr:\n        nxt       = curr.next\n        curr.next = prev\n        prev      = curr\n        curr      = nxt\n    return prev   # new head",
              },
              {
                title: "Detecting a Cycle — Floyd's Algorithm",
                content:
                  "Use two pointers: **slow** moves 1 step, **fast** moves 2 steps. If there's a cycle, they must eventually meet. O(n) time, O(1) space.",
                code: "def has_cycle(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        if slow is fast:\n            return True\n    return False",
              },
            ],
          },
        ],
      },
      {
        section: "Trees & Graphs",
        lessons: [
          {
            id: 5,
            title: "Binary Trees Deep Dive",
            duration: "42:10",
            free: false,
            type: "slides",
            videoId: null,
            description:
              "Tree terminology, traversals (inorder, preorder, postorder), height, depth. Recursive and iterative solutions.",
            slides: [
              {
                title: "Tree Terminology",
                content:
                  "• **Root** — the topmost node (no parent)\n• **Leaf** — node with no children\n• **Height** — max depth from root to a leaf\n• **Balanced** — height difference between subtrees ≤ 1\n• **Complete** — all levels full except possibly last",
                code: "class TreeNode:\n    def __init__(self, val):\n        self.val   = val\n        self.left  = None\n        self.right = None",
              },
              {
                title: "Three DFS Traversals",
                content:
                  "• **Inorder** (L → Root → R): gives **sorted output** for BST\n• **Preorder** (Root → L → R): useful for copying a tree\n• **Postorder** (L → R → Root): useful for deletion, eval",
                code: "def inorder(root):\n    if not root: return []\n    return inorder(root.left) + [root.val] + inorder(root.right)\n\n# Iterative inorder (O(1) space w/ Morris traversal)\ndef inorder_iter(root):\n    stack, result = [], []\n    curr = root\n    while curr or stack:\n        while curr:\n            stack.append(curr)\n            curr = curr.left\n        curr = stack.pop()\n        result.append(curr.val)\n        curr = curr.right\n    return result",
              },
            ],
          },
          {
            id: 6,
            title: "BST Operations",
            duration: "35:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Insert, search, delete in Binary Search Tree. Balanced BSTs overview: AVL and Red-Black trees.",
            slides: null,
          },
          {
            id: 7,
            title: "Graph Representation",
            duration: "28:15",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Adjacency matrix vs adjacency list. Directed vs undirected. Weighted graphs.",
            slides: null,
          },
          {
            id: 8,
            title: "BFS & DFS",
            duration: "41:20",
            free: false,
            type: "slides",
            videoId: null,
            description:
              "Breadth-first and depth-first search. Applications: shortest path, cycle detection, connected components.",
            slides: [
              {
                title: "BFS — Breadth First Search",
                content:
                  "BFS explores nodes **level by level** using a queue. Best for finding **shortest path** in an unweighted graph. Time: O(V+E), Space: O(V).",
                code: "from collections import deque\n\ndef bfs(graph, start):\n    visited = {start}\n    queue   = deque([start])\n    order   = []\n    while queue:\n        node = queue.popleft()\n        order.append(node)\n        for nei in graph[node]:\n            if nei not in visited:\n                visited.add(nei)\n                queue.append(nei)\n    return order",
              },
              {
                title: "DFS — Depth First Search",
                content:
                  "DFS explores as **deep as possible** before backtracking. Uses a stack (or recursion). Great for cycle detection, topological sort, connected components.",
                code: "def dfs(graph, start, visited=None):\n    if visited is None: visited = set()\n    visited.add(start)\n    for nei in graph[start]:\n        if nei not in visited:\n            dfs(graph, nei, visited)\n    return visited",
              },
            ],
          },
        ],
      },
      {
        section: "Sorting & Searching",
        lessons: [
          {
            id: 9,
            title: "QuickSort & MergeSort",
            duration: "30:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Divide-and-conquer sorting. QuickSort avg O(n log n), MergeSort guaranteed O(n log n). In-place vs stable sort trade-offs.",
            slides: null,
          },
          {
            id: 10,
            title: "Binary Search Patterns",
            duration: "25:30",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Beyond basic binary search: search in rotated array, find peak element, binary search on the answer.",
            slides: null,
          },
          {
            id: 11,
            title: "Heap & Priority Queue",
            duration: "38:10",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Min-heap, max-heap. heapq in Python. Top-K problems. Heap sort.",
            slides: null,
          },
        ],
      },
      {
        section: "Dynamic Programming",
        lessons: [
          {
            id: 12,
            title: "DP Foundations & Memoization",
            duration: "52:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "What is dynamic programming? Top-down vs bottom-up. Fibonacci, climbing stairs, coin change problems.",
            slides: null,
          },
          {
            id: 13,
            title: "Classic DP Problems",
            duration: "64:20",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Longest common subsequence, 0/1 knapsack, longest increasing subsequence, edit distance.",
            slides: null,
          },
          {
            id: 14,
            title: "Interview Strategy & Mock",
            duration: "40:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "How to approach problems in interviews. Time management and communication tips. Full mock interview walkthrough.",
            slides: null,
          },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════
     КУРС 2 — Machine Learning Fundamentals
  ══════════════════════════════════════════════════════════ */
  2: {
    id: 2,
    title: "Machine Learning Fundamentals",
    subtitle:
      "From linear regression to neural networks — build a solid ML foundation with hands-on Python projects.",
    description: `Machine Learning is transforming every industry. This course gives you both the mathematical intuition and the practical skills to build and deploy real ML models.\n\nWe start from scratch — assuming only Python knowledge — and build up to training neural networks with PyTorch. Every concept is backed by working code you can run immediately.\n\nYou'll complete 5 hands-on projects including a spam classifier, image recognizer, and a deployed prediction API.`,
    instructor: {
      name: "Sarah Chen",
      role: "ML Engineer @ DeepMind",
      avatar: "SC",
      rating: 4.8,
      students: 18900,
      courses: 5,
      bio: "Sarah has published 3 ML papers and worked on AlphaFold at DeepMind. She's passionate about making ML accessible to everyone.",
    },
    rating: 4.8,
    reviewCount: 1890,
    students: 18900,
    duration: "42h",
    totalLessons: 16,
    level: "Intermediate",
    lastUpdated: "February 2025",
    language: "English",
    price: 59,
    originalPrice: 149,
    thumb:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=900&q=80",
    category: "Artificial Intelligence",
    tags: ["Machine Learning", "Python", "Neural Networks", "Scikit-learn"],
    previewVideoId: "ukzFI9rgwfU",
    whatYouLearn: [
      "Understand supervised and unsupervised learning",
      "Build regression and classification models",
      "Work with scikit-learn, pandas and numpy",
      "Train your first neural network with PyTorch",
      "Evaluate and tune model performance",
      "Deploy ML models to production with FastAPI",
    ],
    curriculum: [
      {
        section: "ML Foundations",
        lessons: [
          {
            id: 1,
            title: "What is Machine Learning?",
            duration: "12:00",
            free: true,
            type: "slides+video",
            videoId: "ukzFI9rgwfU",
            description:
              "Overview of ML types: supervised, unsupervised, reinforcement learning. Real-world applications and the ML workflow.",
            slides: [
              {
                title: "Three Types of Machine Learning",
                content:
                  "**Supervised Learning** — learn from labelled data\nExamples: spam detection, price prediction, image classification\n\n**Unsupervised Learning** — find patterns in unlabelled data\nExamples: customer clustering, anomaly detection, PCA\n\n**Reinforcement Learning** — learn by reward/punishment\nExamples: game AI, robotics, recommendation systems",
                code: null,
              },
              {
                title: "The ML Workflow",
                content:
                  "Every ML project follows the same pipeline:\n\n1. **Collect** data\n2. **Clean** and preprocess\n3. **Explore** (EDA)\n4. **Select** features\n5. **Train** model\n6. **Evaluate** performance\n7. **Deploy** to production\n8. **Monitor** and retrain",
                code: null,
              },
            ],
          },
          {
            id: 2,
            title: "Python & NumPy Refresher",
            duration: "22:30",
            free: true,
            type: "video",
            videoId: "QUT1VHiLmmI",
            description:
              "Quick review of Python, NumPy arrays, pandas DataFrames. Everything you need before the ML topics.",
            slides: null,
          },
          {
            id: 3,
            title: "Linear Regression from Scratch",
            duration: "35:00",
            free: false,
            type: "slides",
            videoId: null,
            description:
              "Implement gradient descent, cost function, and normal equation. Build a house price predictor.",
            slides: [
              {
                title: "The Hypothesis",
                content:
                  "Linear regression models the relationship between input features **X** and a continuous output **y**:\n\n**h(x) = θ₀ + θ₁x₁ + ... + θₙxₙ**\n\nGoal: find θ values that minimise prediction error.",
                code: 'import numpy as np\n\ndef predict(X, theta):\n    """X shape: (m, n+1)  theta shape: (n+1,)"""\n    return X @ theta\n\ndef mse(y_pred, y_true):\n    return np.mean((y_pred - y_true) ** 2)',
              },
              {
                title: "Gradient Descent",
                content:
                  "Iteratively update parameters in the direction of steepest descent:\n\n**θ = θ - α · ∇J(θ)**\n\n• α (learning rate): too large → overshoot, too small → slow\n• ∇J: partial derivatives of cost function",
                code: "def gradient_descent(X, y, theta, lr=0.01, epochs=1000):\n    m = len(y)\n    history = []\n    for _ in range(epochs):\n        preds    = X @ theta\n        error    = preds - y\n        gradient = (2/m) * X.T @ error\n        theta   -= lr * gradient\n        history.append(mse(preds, y))\n    return theta, history",
              },
            ],
          },
          {
            id: 4,
            title: "Logistic Regression",
            duration: "30:10",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Binary classification with logistic regression. Sigmoid function, decision boundary, cross-entropy loss.",
            slides: null,
          },
        ],
      },
      {
        section: "Classical ML",
        lessons: [
          {
            id: 5,
            title: "Decision Trees & Random Forests",
            duration: "38:20",
            free: false,
            type: "video",
            videoId: null,
            description:
              "How trees split data. Gini impurity vs entropy. Random forests as an ensemble of decorrelated trees.",
            slides: null,
          },
          {
            id: 6,
            title: "SVM & Kernel Methods",
            duration: "32:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Support vector machines and the kernel trick. SVM for text classification.",
            slides: null,
          },
          {
            id: 7,
            title: "K-Means Clustering",
            duration: "28:45",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Unsupervised clustering. Choosing K with the elbow method. Customer segmentation project.",
            slides: null,
          },
          {
            id: 8,
            title: "Dimensionality Reduction (PCA)",
            duration: "25:10",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Principal Component Analysis. Eigenvalues and eigenvectors. Visualising high-dimensional data in 2D.",
            slides: null,
          },
        ],
      },
      {
        section: "Neural Networks",
        lessons: [
          {
            id: 9,
            title: "Intro to Neural Networks",
            duration: "42:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Neurons, layers, activation functions (ReLU, sigmoid, tanh). Forward pass and universal approximation theorem.",
            slides: null,
          },
          {
            id: 10,
            title: "Backpropagation Explained",
            duration: "38:30",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Chain rule, computational graphs, gradient flow. Why deep networks can suffer from vanishing gradients.",
            slides: null,
          },
          {
            id: 11,
            title: "Training with PyTorch",
            duration: "50:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Tensors, autograd, nn.Module, optimizers. Full training loop with validation.",
            slides: null,
          },
          {
            id: 12,
            title: "CNNs for Image Classification",
            duration: "55:20",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Convolutional layers, pooling, ResNet architecture. Build a CIFAR-10 image classifier.",
            slides: null,
          },
        ],
      },
      {
        section: "Production ML",
        lessons: [
          {
            id: 13,
            title: "Model Evaluation & Metrics",
            duration: "30:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Accuracy, precision, recall, F1, ROC-AUC. Confusion matrix. Cross-validation techniques.",
            slides: null,
          },
          {
            id: 14,
            title: "Hyperparameter Tuning",
            duration: "28:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Grid search, random search, Bayesian optimisation with Optuna. Avoiding overfitting.",
            slides: null,
          },
          {
            id: 15,
            title: "Deploying with FastAPI",
            duration: "40:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Pickle model, build REST API, Dockerfile, deploy to cloud. Real-time prediction endpoint.",
            slides: null,
          },
          {
            id: 16,
            title: "Capstone Project",
            duration: "60:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "End-to-end ML project: data collection → EDA → feature engineering → training → deployment.",
            slides: null,
          },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════
     КУРС 3 — React & Next.js Mastery
  ══════════════════════════════════════════════════════════ */
  3: {
    id: 3,
    title: "React & Next.js Mastery",
    subtitle:
      "Build production-grade web apps with React 18, Next.js 14, TypeScript, and modern patterns.",
    description: `React is the most popular front-end library in the world. This course takes you from React basics all the way to building and deploying full-stack apps with Next.js 14's App Router.\n\nYou'll learn modern patterns used at companies like Vercel, Shopify and Stripe: server components, streaming, parallel routes, and more.\n\nBy the end you'll have a production-ready SaaS app in your portfolio.`,
    instructor: {
      name: "Marcus Lee",
      role: "Staff Engineer @ Vercel",
      avatar: "ML",
      rating: 4.9,
      students: 31200,
      courses: 12,
      bio: "Marcus is a core contributor to Next.js and has built apps used by millions. He leads Vercel's developer education team.",
    },
    rating: 4.9,
    reviewCount: 3120,
    students: 31200,
    duration: "38h",
    totalLessons: 20,
    level: "Intermediate",
    lastUpdated: "March 2025",
    language: "English",
    price: 49,
    originalPrice: 99,
    thumb:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=900&q=80",
    category: "Web Development",
    tags: ["React", "Next.js", "TypeScript", "Tailwind"],
    previewVideoId: "Tn6-PIqc4UM",
    whatYouLearn: [
      "Master React 18 hooks and concurrent features",
      "Build full-stack apps with Next.js 14 App Router",
      "Use TypeScript with React effectively",
      "Style with Tailwind CSS",
      "Implement auth with NextAuth.js",
      "Deploy to Vercel with CI/CD",
    ],
    curriculum: [
      {
        section: "React Core",
        lessons: [
          {
            id: 1,
            title: "React 18 — What's New",
            duration: "14:20",
            free: true,
            type: "slides+video",
            videoId: "Tn6-PIqc4UM",
            description:
              "Concurrent rendering, automatic batching, useTransition, useDeferredValue — what changed and why it matters.",
            slides: [
              {
                title: "React 18 Key Features",
                content:
                  "**Concurrent Rendering** — React can interrupt, pause, and resume rendering work. UI stays responsive under heavy load.\n\n**Automatic Batching** — multiple setState calls in async code now batch automatically, reducing unnecessary re-renders.\n\n**Transitions** — mark updates as non-urgent to keep UI interactive while heavy state updates process.",
                code: "import { useTransition, useState } from 'react'\n\nfunction SearchPage() {\n  const [query, setQuery]   = useState('')\n  const [results, setResults] = useState([])\n  const [isPending, startTransition] = useTransition()\n\n  const handleChange = (e) => {\n    setQuery(e.target.value)          // urgent: update input\n    startTransition(() => {\n      setResults(heavyFilter(e.target.value)) // non-urgent\n    })\n  }\n  // ...\n}",
              },
              {
                title: "New Hooks in React 18",
                content:
                  "• **useTransition()** — returns [isPending, startTransition] for deferring non-urgent updates\n• **useDeferredValue(val)** — like debounce but integrated with concurrent mode\n• **useId()** — stable unique ID safe for SSR hydration\n• **useSyncExternalStore()** — for subscribing to external stores correctly",
                code: "import { useDeferredValue } from 'react'\n\nfunction List({ items, filterText }) {\n  const deferredFilter = useDeferredValue(filterText)\n  // List re-renders with old filter while new one processes\n  return <SlowList filter={deferredFilter} items={items} />\n}",
              },
            ],
          },
          {
            id: 2,
            title: "Hooks Deep Dive",
            duration: "35:00",
            free: true,
            type: "video",
            videoId: "dpw9EHDh2bM",
            description:
              "useState, useEffect, useRef, useMemo, useCallback, useContext — when and why to use each. Common mistakes and how to avoid them.",
            slides: null,
          },
          {
            id: 3,
            title: "State Management Patterns",
            duration: "28:30",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Context API, Zustand, Redux Toolkit. When to use what. Avoiding context hell.",
            slides: null,
          },
          {
            id: 4,
            title: "Performance Optimization",
            duration: "32:10",
            free: false,
            type: "video",
            videoId: null,
            description:
              "React.memo, useMemo, useCallback, lazy loading, code splitting with Suspense.",
            slides: null,
          },
          {
            id: 5,
            title: "Custom Hooks Workshop",
            duration: "26:40",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Build 5 useful custom hooks: useLocalStorage, useFetch, useDebounce, useIntersection, useMediaQuery.",
            slides: null,
          },
        ],
      },
      {
        section: "Next.js 14",
        lessons: [
          {
            id: 6,
            title: "App Router Architecture",
            duration: "30:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "File-based routing, layouts, loading states, error boundaries, route groups and parallel routes.",
            slides: null,
          },
          {
            id: 7,
            title: "Server & Client Components",
            duration: "38:20",
            free: false,
            type: "video",
            videoId: null,
            description:
              "When to use server vs client. Data fetching patterns. Streaming with Suspense.",
            slides: null,
          },
          {
            id: 8,
            title: "Data Fetching Strategies",
            duration: "42:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "fetch with caching, revalidation, parallel fetching. Server Actions for mutations.",
            slides: null,
          },
          {
            id: 9,
            title: "Next.js API Routes",
            duration: "28:15",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Route Handlers, middleware, Edge Runtime vs Node.js runtime.",
            slides: null,
          },
        ],
      },
      {
        section: "Full Stack Features",
        lessons: [
          {
            id: 10,
            title: "Auth with NextAuth.js",
            duration: "45:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "OAuth (GitHub, Google), credentials, JWT vs database sessions, protected routes.",
            slides: null,
          },
          {
            id: 11,
            title: "Prisma & PostgreSQL",
            duration: "50:30",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Schema definition, migrations, queries, relations. Full CRUD app with Prisma.",
            slides: null,
          },
          {
            id: 12,
            title: "File Uploads & Storage",
            duration: "35:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Upload to S3/Cloudflare R2, preview images, drag-and-drop with react-dropzone.",
            slides: null,
          },
        ],
      },
      {
        section: "Production & Deploy",
        lessons: [
          {
            id: 13,
            title: "Testing with Vitest & RTL",
            duration: "40:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Unit tests, integration tests, testing async components and forms.",
            slides: null,
          },
          {
            id: 14,
            title: "CI/CD with GitHub Actions",
            duration: "30:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Automated tests, type checking, Lighthouse CI, preview deploys.",
            slides: null,
          },
          {
            id: 15,
            title: "Deploy to Vercel",
            duration: "22:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Environment variables, custom domains, Vercel Analytics, edge config.",
            slides: null,
          },
          {
            id: 16,
            title: "Monitoring & Analytics",
            duration: "25:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Vercel Analytics, Sentry error tracking, performance budgets.",
            slides: null,
          },
          {
            id: 17,
            title: "SEO & Metadata",
            duration: "18:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Next.js Metadata API, Open Graph, structured data, sitemap generation.",
            slides: null,
          },
          {
            id: 18,
            title: "Internationalisation",
            duration: "22:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "next-intl, locale routing, pluralisation, RTL support.",
            slides: null,
          },
          {
            id: 19,
            title: "Capstone: SaaS App",
            duration: "90:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Build a complete SaaS from scratch: auth, billing with Stripe, dashboard, settings page.",
            slides: null,
          },
          {
            id: 20,
            title: "Final Review & Next Steps",
            duration: "15:00",
            free: false,
            type: "video",
            videoId: null,
            description:
              "Course recap, career advice, what to build next, community resources.",
            slides: null,
          },
        ],
      },
    ],
  },
};

// Fallback for courses not in the catalogue yet
export const getFallbackCourse = (id) => ({
  id,
  title: `Course #${id}`,
  subtitle:
    "A comprehensive course to level up your skills with expert instructors.",
  description:
    "Full content for this course is coming soon. Check back shortly.",
  instructor: {
    name: "EduStream Team",
    role: "Expert Instructors",
    avatar: "ES",
    rating: 4.7,
    students: 5000,
    courses: 3,
    bio: "Our team of experts.",
  },
  rating: 4.7,
  reviewCount: 500,
  students: 5000,
  duration: "20h",
  totalLessons: 4,
  level: "Beginner",
  lastUpdated: "2025",
  language: "English",
  price: 39,
  originalPrice: 79,
  thumb:
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&q=80",
  category: "General",
  tags: ["Learning", "Skills"],
  previewVideoId: "rfscVS0vtbw",
  whatYouLearn: [
    "Understand core concepts",
    "Build practical projects",
    "Apply knowledge to real problems",
    "Get certified",
  ],
  curriculum: [
    {
      section: "Introduction",
      lessons: [
        {
          id: 1,
          title: "Welcome & Overview",
          duration: "8:00",
          free: true,
          type: "video",
          videoId: "rfscVS0vtbw",
          description: "Course introduction and overview.",
          slides: null,
        },
        {
          id: 2,
          title: "Setting Up",
          duration: "12:00",
          free: true,
          type: "video",
          videoId: null,
          description: "Environment setup.",
          slides: null,
        },
        {
          id: 3,
          title: "Core Concepts",
          duration: "25:00",
          free: false,
          type: "video",
          videoId: null,
          description: "Core concepts deep dive.",
          slides: null,
        },
        {
          id: 4,
          title: "First Project",
          duration: "35:00",
          free: false,
          type: "video",
          videoId: null,
          description: "Build your first project.",
          slides: null,
        },
      ],
    },
  ],
});

// Seed comments per course
export const SEED_COMMENTS = {
  1: [
    {
      id: 1,
      author: "Ivan S.",
      avatar: "IS",
      rating: 5,
      date: "Feb 2025",
      text: "Best algo course I've taken. Andrew explains everything so clearly. Landed a Google interview after this!",
    },
    {
      id: 2,
      author: "Olga M.",
      avatar: "OM",
      rating: 5,
      date: "Jan 2025",
      text: "Got my dream job at FAANG after going through this course. The DP section is pure gold.",
    },
    {
      id: 3,
      author: "Tom W.",
      avatar: "TW",
      rating: 4,
      date: "Mar 2025",
      text: "Very comprehensive. The DP section is particularly well done. Would love more graph problems.",
    },
    {
      id: 4,
      author: "Lisa K.",
      avatar: "LK",
      rating: 5,
      date: "Mar 2025",
      text: "I've tried 4 other algorithm courses. This one finally made Big-O click for me. 10/10.",
    },
  ],
  2: [
    {
      id: 1,
      author: "Alex T.",
      avatar: "AT",
      rating: 5,
      date: "Mar 2025",
      text: "Sarah makes ML accessible without dumbing it down. The PyTorch sections are fantastic.",
    },
    {
      id: 2,
      author: "Maria K.",
      avatar: "MK",
      rating: 5,
      date: "Feb 2025",
      text: "Best investment I've made this year. Got a Data Scientist role within 3 months.",
    },
    {
      id: 3,
      author: "James R.",
      avatar: "JR",
      rating: 4,
      date: "Jan 2025",
      text: "Very well structured. I especially loved the hands-on projects. Highly recommend.",
    },
  ],
  3: [
    {
      id: 1,
      author: "Daria N.",
      avatar: "DN",
      rating: 5,
      date: "Mar 2025",
      text: "Marcus is brilliant. The App Router section saved me weeks of confusion with the Next.js docs.",
    },
    {
      id: 2,
      author: "Chris P.",
      avatar: "CP",
      rating: 5,
      date: "Feb 2025",
      text: "Went from junior to mid-level dev after this course. The SaaS capstone is a real portfolio piece.",
    },
    {
      id: 3,
      author: "Elena V.",
      avatar: "EV",
      rating: 4,
      date: "Mar 2025",
      text: "Very thorough. Would love more real-world project examples but overall excellent.",
    },
  ],
};
