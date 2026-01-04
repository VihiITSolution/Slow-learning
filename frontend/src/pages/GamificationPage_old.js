<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Your Adventure - LearnSphere</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"/>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
<script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#25d1f4",
                        "background-light": "#f8fbfc",
                        "background-dark": "#101f22",
                        "card-light": "#ffffff",
                        "card-dark": "#1a2c30",
                        "text-light": "#0d191c",
                        "text-dark": "#e7f1f4",
                        "text-muted-light": "#498e9c",
                        "text-muted-dark": "#a1c7cf",
                        "border-light": "#e7f1f4",
                        "border-dark": "#2a4247",
                        "accent": "#F5A623",
                        "secondary": "#50E3C2",
                    },
                    fontFamily: {
                        "display": ["Inter", "sans-serif"]
                    },
                    borderRadius: {
                        "DEFAULT": "0.5rem",
                        "lg": "1rem",
                        "xl": "1.5rem",
                        "full": "9999px"
                    },
                },
            },
        }
    </script>
</head>
<body class="font-display bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
<div class="relative flex min-h-screen w-full flex-col">
<!-- TopNavBar -->
<header class="sticky top-0 z-50 w-full border-b border-border-light dark:border-border-dark bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div class="flex items-center justify-between h-16">
<div class="flex items-center gap-4">
<div class="text-primary size-7">
<svg fill="currentColor" viewbox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fill="currentColor" fill-rule="evenodd"></path></svg>
</div>
<h2 class="text-lg font-bold">LearnSphere</h2>
</div>
<div class="hidden md:flex items-center gap-9">
<a class="text-sm font-medium hover:text-primary transition-colors" href="#">Dashboard</a>
<a class="text-sm font-medium text-primary border-b-2 border-primary" href="#">Adventure</a>
<a class="text-sm font-medium hover:text-primary transition-colors" href="#">Profile</a>
</div>
<div class="flex items-center gap-4">
<button class="flex cursor-pointer items-center justify-center rounded-xl h-10 w-10 bg-primary/20 dark:bg-primary/30 text-text-light dark:text-text-dark hover:bg-primary/40 transition-colors">
<span class="material-symbols-outlined">notifications</span>
</button>
<div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" data-alt="User avatar image" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuDD5vbfMY0aeUJ9WL7E9UiJgI1_Vd0ki6JQfTKHtHK0JMLCIUW2g0-6R37WrYgcsNYs6wPkUDpK1cw8mlw_2C3rpeH6tgYV1iSJAtXhsOhNEy7PKLekgRe46DTOjPAzGl97JEJepfmvBN7uY3pufIEAjtuuJlypdwQhYLy6Gn_jowIhl6Ypln5nHG6lE_qnZRX7sfqHUfX5JYX7zUSLNs5mIILRdB_jhZL07-hE9AV6IDtwZv8WoMeO6wATb0c-dhkBFjkzHyLnf5Ze");'></div>
</div>
</div>
</div>
</header>
<main class="flex-1">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
<!-- PageHeading -->
<div class="mb-8">
<h1 class="text-4xl font-black tracking-tighter">Your Adventure</h1>
<p class="text-text-muted-light dark:text-text-muted-dark text-lg mt-1">Welcome back! Check out your amazing progress.</p>
</div>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
<div class="lg:col-span-2 space-y-8">
<!-- XP Progression Timeline Card -->
<div class="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm">
<h2 class="text-xl font-bold mb-4">Level Progression</h2>
<!-- ProgressBar -->
<div class="flex flex-col gap-3">
<div class="flex gap-6 justify-between items-center">
<p class="text-base font-bold text-accent">Level 5</p>
<p class="text-sm font-medium">65%</p>
</div>
<div class="rounded-full bg-primary/20"><div class="h-3 rounded-full bg-primary" style="width: 65%;"></div></div>
<p class="text-sm text-text-muted-light dark:text-text-muted-dark">350 XP to Level 6</p>
</div>
</div>
<!-- Badge Collection Grid -->
<div>
<!-- SectionHeader -->
<h2 class="text-2xl font-bold tracking-tight mb-4">Badge Collection</h2>
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
<!-- Earned Badge -->
<div class="flex flex-col items-center p-4 bg-card-light dark:bg-card-dark rounded-xl shadow-sm text-center">
<div class="w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center mb-2">
<span class="material-symbols-outlined text-white text-4xl">local_fire_department</span>
</div>
<h3 class="font-bold text-sm">Daily Learner</h3>
<p class="text-xs text-text-muted-light dark:text-text-muted-dark">5-Day Streak</p>
</div>
<!-- Earned Badge -->
<div class="flex flex-col items-center p-4 bg-card-light dark:bg-card-dark rounded-xl shadow-sm text-center">
<div class="w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center mb-2">
<span class="material-symbols-outlined text-white text-4xl">star</span>
</div>
<h3 class="font-bold text-sm">Topic Master</h3>
<p class="text-xs text-text-muted-light dark:text-text-muted-dark">Completed 'Algebra'</p>
</div>
<!-- Unearned Badge -->
<div class="flex flex-col items-center p-4 bg-card-light dark:bg-card-dark rounded-xl shadow-sm text-center opacity-50">
<div class="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2">
<span class="material-symbols-outlined text-gray-500 dark:text-gray-400 text-4xl">psychology</span>
</div>
<h3 class="font-bold text-sm">Curious Mind</h3>
<p class="text-xs text-text-muted-light dark:text-text-muted-dark">Ask 10 questions</p>
</div>
<!-- Unearned Badge -->
<div class="flex flex-col items-center p-4 bg-card-light dark:bg-card-dark rounded-xl shadow-sm text-center opacity-50">
<div class="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2">
<span class="material-symbols-outlined text-gray-500 dark:text-gray-400 text-4xl">rocket_launch</span>
</div>
<h3 class="font-bold text-sm">Quick Starter</h3>
<p class="text-xs text-text-muted-light dark:text-text-muted-dark">Finish first lesson</p>
</div>
</div>
</div>
<!-- Achievement Feed -->
<div>
<h2 class="text-2xl font-bold tracking-tight mb-4">Recent Achievements</h2>
<div class="space-y-3">
<div class="flex items-center gap-4 p-4 bg-card-light dark:bg-card-dark rounded-xl shadow-sm">
<div class="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
<span class="material-symbols-outlined text-secondary">task_alt</span>
</div>
<div class="flex-1">
<p class="font-medium">You completed 10 lessons!</p>
<p class="text-sm text-text-muted-light dark:text-text-muted-dark">2 days ago</p>
</div>
</div>
<div class="flex items-center gap-4 p-4 bg-card-light dark:bg-card-dark rounded-xl shadow-sm">
<div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
<span class="material-symbols-outlined text-primary">emoji_events</span>
</div>
<div class="flex-1">
<p class="font-medium">Unlocked the 'Topic Master' badge.</p>
<p class="text-sm text-text-muted-light dark:text-text-muted-dark">4 days ago</p>
</div>
</div>
</div>
</div>
</div>
<div class="lg:col-span-1 space-y-8">
<!-- Avatar Customization Card -->
<div class="bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-sm">
<div class="flex flex-col items-stretch justify-start">
<div class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl mb-4" data-alt="User's customizable avatar on a colorful background" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCgwsh4GAAKe9LThO4kfyUvv-x5zwqLfupekZf8yPCBSk5dpxS2N5VwWekqEo1JnLi2JGVc8n0dagIFDJXKOzWD93aDVuoRxOn6C6QKcuBMQha6mu1LQQs-CJj5ykOCC2IbxbHRc_9y-0yw8fOgVp8iHED3Rw0ENUGiQEvp_RPHR27c1QC3uRqW36DJDM6adnd7-qmViLj_8o62bFtGrTs-sifkG0eZQIYARr2rE1jP5fu89pNxtebYY-ZDhBw8SLaXu2DrKSYqjCvP");'></div>
<div class="flex w-full flex-col items-stretch justify-center gap-1">
<p class="text-lg font-bold">Alex</p>
<div class="flex items-end gap-3 justify-between">
<div class="flex flex-col gap-1">
<p class="text-text-muted-light dark:text-text-muted-dark text-base">Level 5 Adventurer</p>
<p class="text-text-muted-light dark:text-text-muted-dark text-base">Looking sharp!</p>
</div>
<button class="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-text-light text-sm font-bold shadow-sm hover:bg-opacity-90 transition-all">
<span>Customize</span>
</button>
</div>
</div>
</div>
</div>
<!-- Streak Calendar Card -->
<div class="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm">
<div class="flex items-center justify-between mb-4">
<h2 class="text-xl font-bold">Streak Calendar</h2>
<p class="font-bold text-accent">15-Day Streak!</p>
</div>
<div class="grid grid-cols-7 gap-2 text-center text-sm">
<div class="font-medium text-text-muted-light dark:text-text-muted-dark">Su</div>
<div class="font-medium text-text-muted-light dark:text-text-muted-dark">Mo</div>
<div class="font-medium text-text-muted-light dark:text-text-muted-dark">Tu</div>
<div class="font-medium text-text-muted-light dark:text-text-muted-dark">We</div>
<div class="font-medium text-text-muted-light dark:text-text-muted-dark">Th</div>
<div class="font-medium text-text-muted-light dark:text-text-muted-dark">Fr</div>
<div class="font-medium text-text-muted-light dark:text-text-muted-dark">Sa</div>
<!-- Calendar days -->
<div class="text-text-muted-light dark:text-text-muted-dark opacity-50">28</div>
<div class="text-text-muted-light dark:text-text-muted-dark opacity-50">29</div>
<div class="text-text-muted-light dark:text-text-muted-dark opacity-50">30</div>
<div class="text-text-muted-light dark:text-text-muted-dark opacity-50">31</div>
<div class="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">1</div>
<div class="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">2</div>
<div class="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">3</div>
<div class="w-8 h-8 rounded-full flex items-center justify-center">4</div>
<div class="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">5</div>
<div class="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">6</div>
<div class="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">7</div>
<div class="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">8</div>
<div class="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">9</div>
<div class="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">10</div>
<div class="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">11</div>
<div class="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">12</div>
<div class="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">13</div>
<div class="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">14</div>
<div class="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">15</div>
<div class="w-8 h-8 rounded-full flex items-center justify-center text-white bg-primary ring-2 ring-offset-2 ring-offset-card-light dark:ring-offset-card-dark ring-primary">16</div>
<div class="w-8 h-8 rounded-full flex items-center justify-center">17</div>
</div>
</div>
</div>
</div>
</div>
</main>
</div>
</body></html>