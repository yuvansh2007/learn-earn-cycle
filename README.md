# SkillSwap Connect

Build a complete, production-quality responsive web application called SkillSwap.

PRODUCT VISION

SkillSwap is a university-focused peer-to-peer learning platform where students can:

Create an account and student profile.

Select topics/skills they are interested in learning.

Select topics/skills they can teach.

Discover students and teachers who match their learning goals.

Connect with other users.

Organize and attend online teaching sessions.

Create group teaching sessions where one teacher can teach multiple students.

Automatically generate/organize Google Meet sessions for scheduled classes.

Earn SkillSwap Coins by successfully conducting teaching sessions.

Spend SkillSwap Coins ONLY inside SkillSwap to purchase books/resources related to their interests.

Build a reputation through completed sessions, ratings and reviews.

Track their learning progress, teaching history, coins and purchased books.

The platform should feel like a combination of:

peer-learning network

skill exchange platform

online classroom

teaching marketplace

educational rewards system

Do NOT make this look like a generic social media website.

The core identity should be:
LEARN → TEACH → EARN → REINVEST

DESIGN REQUIREMENTS

Create a modern, premium, student-friendly interface.

Use:

clean modern typography

rounded cards

subtle shadows

attractive gradients used sparingly

professional educational dashboard

responsive design

excellent desktop and mobile layouts

smooth hover states

clear call-to-action buttons

icons where appropriate

visually strong dashboards

accessible color contrast

The website should look suitable for a university hackathon demonstration.

Create a consistent design system across every page.

AUTHENTICATION

Create:

Login Page

Fields:

Email

Password

Options:

Login

Forgot Password

Continue with Google if supported

Registration Page

Fields:

Full Name

Email

Password

University/College

Course

Year of Study

After registration, take the user through an onboarding process.

ONBOARDING

Create a multi-step onboarding flow.

Step 1 — About You

Ask:

Name

University

Course

Year

Short bio

Step 2 — What can you teach?

Allow users to select multiple skills.

Provide categories such as:

Programming:

C++

C

Java

Python

JavaScript

HTML

CSS

React

Data Structures & Algorithms

Machine Learning

Web Development

Design:

UI/UX

Figma

Graphic Design

Video Editing

Academic:

Mathematics

Physics

Chemistry

Biology

Economics

Communication:

Public Speaking

English

Communication Skills

Presentation Skills

Other:

Photography

Music

Marketing

Content Writing

Entrepreneurship

Allow users to add custom skills.

Step 3 — What do you want to learn?

Use the same skill/category system.

Allow users to select multiple interests.

Step 4 — Experience Level

For each selected skill allow:

Beginner

Intermediate

Advanced

Expert

Step 5 — Availability

Allow students to select:

Days

Preferred time

Online/offline preference

Finish onboarding and take the user to the dashboard.

MAIN DASHBOARD

Create a personalized dashboard.

Display:

Welcome Section

"Welcome back, [Name] 👋"

Show:

Coins

Skills taught

Skills learned

Sessions completed

Average rating

Recommended Learning

Show skills that the user wants to learn.

Example:

JavaScript
Python
UI/UX

Each should have:

Skill level

Number of available teachers

"Find Teacher" button

Recommended Teachers

Display cards containing:

Profile picture

Name

Skills

Experience

Rating

Sessions completed

Match percentage

Availability

Connect button

Request Session button

Recommended Students

Show users who want to learn skills that the current user can teach.

Include:

Name

Skill they want to learn

Match percentage

Connect

Offer Teaching Session

Upcoming Sessions

Show:

Session title

Teacher

Date

Time

Number of participants

Google Meet button

Coin Summary

Show:

Current balance

Coins earned

Coins spent

Recent transactions

PROFILE PAGE

Create a detailed student profile.

Show:

Profile picture

Name

University

Course

Year

Bio

Skills they teach

Skills they want to learn

Experience level

Rating

Number of sessions taught

Number of sessions attended

Availability

Buttons:

Connect

Message

Request Teaching Session

Invite to Group Session

SKILL DISCOVERY PAGE

Create an Explore page.

Users should be able to search:

"What do you want to learn?"

Add:

Search bar

Categories

Skill filters

Experience level

Availability

Rating

Online/offline

When a skill is selected, show matching teachers.

Example:

Learn JavaScript

Teacher cards should show:

Teacher:
Ananya Sharma

Can teach:
JavaScript
React
HTML/CSS

Rating:
4.8 ⭐

Experience:
Advanced

Match:
94%

Availability:
Saturday, Sunday

Buttons:
[Connect]
[Request Session]

MATCHING SYSTEM

Implement a basic explainable matching system.

A match score should consider:

Skill compatibility — 50%

Availability overlap — 20%

Common interests — 10%

Experience compatibility — 10%

Reputation/trust — 10%

Display a score from 0–100%.

Example:

94% Match

Explain why:

✓ You want to learn JavaScript
✓ They teach JavaScript
✓ Your schedules overlap
✓ Similar interests
✓ High teaching rating

Do not make the recommendation a black box.

Structure the code so that the matching logic can later be replaced with a graph/DSA-based algorithm.

CONNECTION SYSTEM

Allow users to connect with each other.

Connection states:

Connect

Request Sent

Connected

Remove Connection

Create a Connections page showing:

My Connections

Pending Requests

Suggested Connections

TEACHING SESSION SYSTEM

This is a major feature.

Users who can teach a skill should be able to create a teaching session.

Create a "Create Session" form:

Session title

Skill/topic

Description

Teacher

Date

Start time

Duration

Maximum participants

Online/offline

Skill level

Session price in SkillSwap Coins

Learning objectives

Example:

"Introduction to C++ STL"

Teacher:
Rahul

Date:
Saturday

Time:
5:00 PM

Duration:
60 minutes

Maximum students:
10

Cost:
20 SkillSwap Coins

GROUP TEACHING

Allow one teacher to teach multiple students.

Students can browse available group sessions.

Show:

"Python for Beginners"

Teacher: Priya

Rating: 4.9 ⭐

Participants:
7 / 10

Cost:
15 Coins

[Join Session]

When a student joins:

deduct the required coins

add them to the session participant list

reserve their seat

The teacher earns coins only after the session is successfully completed.

GOOGLE MEET INTEGRATION

Design the application so teaching sessions can be organized through Google Meet.

For each online session include:

Create/Generate Google Meet link

Meeting link

Add to calendar

Copy meeting link

Join Meeting button

Store the meeting URL with the session.

If direct Google Calendar/Meet API integration requires credentials that are unavailable during development, implement a clean integration-ready architecture and provide a mock/demo Meet link system so the complete workflow can still be demonstrated.

Do NOT pretend a fake Google API integration is real.

SESSION MANAGEMENT

Create a Sessions page with:

Upcoming

Show:

Session name

Teacher

Date

Time

Participants

Meet link

Join button

Completed

Show:

Session

Date

Participants

Coins earned/spent

Rating

My Teaching Sessions

Allow teachers to:

Create

Edit

Cancel

Start

Complete sessions

COIN ECONOMY

Create a virtual currency called:

SkillSwap Coins

Important rule:

Coins have NO cash value and cannot be withdrawn or converted into real money.

Coins are earned by teaching and can ONLY be spent inside SkillSwap.

Users should never be able to transfer coins directly to another user.

EARNING COINS

After a teaching session is successfully completed:

Teacher receives the session reward.

Example:

60-minute teaching session:
+20 SkillSwap Coins

Group session:
Teacher receives the predefined reward after successful completion.

SPENDING COINS

Users can spend coins on educational books/resources available inside the SkillSwap marketplace.

Create a complete wallet page.

Show:

Current Balance
Coins Earned
Coins Spent
Transaction History

Example:

+20 — Completed C++ Session
+30 — Completed Python Group Session
-25 — Purchased "JavaScript Fundamentals"

COIN TRANSACTION SYSTEM

Create a transaction ledger.

Each transaction should contain:

Transaction ID

User

Type

Amount

Description

Date

Related session/product

Status

Types:

SESSION_REWARD

BOOK_PURCHASE

SESSION_REFUND

BONUS

ADMIN_ADJUSTMENT

Prevent negative balances.

All coin changes must be validated on the backend/database rather than relying only on frontend JavaScript.

BOOK MARKETPLACE

Create a section called:

SkillSwap Library

Users can use SkillSwap Coins to purchase educational books/resources.

Categories:

Programming

Web Development

Data Science

AI/ML

Design

Business

Mathematics

Science

Communication

Personal Development

Book cards should display:

Cover image

Book title

Author

Category

Description

Skill/topic

Coin price

Rating

[Purchase]

Example:

"JavaScript: The Definitive Guide"

25 SkillSwap Coins

[Buy with Coins]

PURCHASE SYSTEM

When the user clicks Purchase:

Check coin balance.

If insufficient coins:
Show "You need 10 more SkillSwap Coins."

If sufficient:
Deduct coins.

Create purchase record.

Add book to "My Library".

Show confirmation.

Never allow the frontend alone to decide whether the purchase succeeds.

MY LIBRARY

Users should have a personal library.

Display purchased books/resources.

Each card:

Cover

Title

Author

Category

Purchase date

Open/View button

RATINGS AND REVIEWS

After a completed teaching session:

Students can rate the teacher.

Use:

1–5 stars

Optional written review

Calculate teacher reputation.

Display:

Average rating

Number of reviews

Number of sessions completed

Only allow ratings after a completed session.

NOTIFICATIONS

Create a notifications system.

Examples:

"Your teaching session starts in 30 minutes."

"Ananya accepted your connection request."

"You joined Python for Beginners."

"You earned 20 SkillSwap Coins."

"Your book purchase was successful."

"New teacher found for JavaScript."

MESSAGING

Create a simple messaging interface between connected users.

Users should be able to:

Send messages

View conversations

Start a conversation from a profile

Keep this simple for the MVP.

SEARCH

Global search should support:

People

Skills

Teaching sessions

Books

ADMIN DASHBOARD

Create a basic admin dashboard.

Admin can see:

Total users

Active users

Total sessions

Completed sessions

Total coins earned

Total coins spent

Popular skills

Popular books

Reports

Admin can manage:

Users

Skills

Sessions

Books/resources

DSA / ALGORITHM SECTION

Create a dedicated page called:

"Smart Matching"

This page should visually explain that SkillSwap uses algorithmic matching.

Show:

Student → Skills → Student

Structure the application so the matching engine can later support:

Hash maps

Graphs

BFS

DFS

Cycle detection

Priority queues

Sorting

The long-term goal is to discover multi-person skill exchange cycles.

Example:

Student A can teach C++ and wants JavaScript.

Student B can teach UI/UX and wants C++.

Student C can teach JavaScript and wants UI/UX.

The system should eventually identify:

A → C → B → A

Label this:

"3-Person Skill Exchange Cycle Found"

For the initial web implementation, create a working demonstrable version using the application's data model and keep the algorithm module isolated and easy to replace with a C++/JavaScript DSA implementation later.

EXCHANGE CYCLE UI

Create a visually impressive graph page.

Show students as nodes.

Show skills exchanged as edges.

Example:

A → JavaScript → C
C → UI/UX → B
B → C++ → A

When a cycle is found:

Highlight it and display:

"Exchange Cycle Found 🎯"

"3 students can collectively satisfy each other's learning goals."

This should be one of the most impressive pages in the application.

GAMIFICATION

Add a lightweight reputation/badge system.

Possible badges:

🏆 Skill Mentor
📚 Fast Learner
🔥 Consistent Teacher
⭐ Top Rated
🤝 Community Builder
🎓 Knowledge Sharer

Do not make gamification overpower the core learning experience.

DATA MODEL

Create a proper persistent data model containing at minimum:

Users
Skills
UserSkills
Connections
Sessions
SessionParticipants
Ratings
CoinTransactions
Books
BookPurchases
Notifications
Messages

Use relationships/foreign keys where appropriate.

SECURITY

Implement basic security best practices.

Important:

Passwords must never be stored in plain text.

Validate all user input.

Validate coin transactions server-side.

Prevent users from purchasing books without sufficient balance.

Prevent duplicate session rewards.

Prevent students from rating sessions they did not attend.

Protect admin routes.

Do not expose secret API keys in frontend code.

Keep Google API credentials server-side if integration is added.

RESPONSIVE DESIGN

The application must work properly on:

Desktop
Tablet
Mobile

Create responsive:

navigation

dashboards

cards

tables

forms

session pages

marketplace

DEMO DATA

Populate the application with realistic demo data so the prototype looks alive immediately.

Create at least:

15 students
20+ skills
10 teaching sessions
10 books/resources
multiple connections
multiple ratings
multiple coin transactions

Create demo users with complementary skills so the matching and exchange-cycle features can be demonstrated.

DEMO FLOW

The application should support this complete demonstration:

Register/login as a student.

Complete profile.

Select "JavaScript" as a desired skill.

View recommended teachers.

See a 90%+ match.

Connect with the teacher.

Join a group teaching session.

See the Google Meet meeting link.

Complete the session.

Teacher receives SkillSwap Coins.

Student rates the teacher.

Student searches the SkillSwap Library.

Student purchases an educational book using SkillSwap Coins.

Book appears in My Library.

Open Smart Matching.

Demonstrate a 3-person exchange cycle.

This entire flow must be functional in the prototype.

TECHNICAL ARCHITECTURE

Use a modern maintainable architecture.

Prefer:

Frontend:
React + TypeScript

Backend:
Use Lovable's supported backend/database infrastructure where appropriate.

Database:
Use a real persistent database.

Authentication:
Use secure authentication.

Keep business logic separated from UI components.

Create reusable components.

Keep matching logic in its own service/module.

Keep coin logic in its own service/module.

Keep session logic in its own service/module.

Keep marketplace logic in its own service/module.

IMPORTANT DEVELOPMENT RULES

Do not build only a static UI.

The buttons should actually work.

Forms should save data.

Users should persist.

Sessions should persist.

Connections should persist.

Coin balances should update.

Book purchases should persist.

Ratings should persist.

Use realistic loading, success and error states.

Do not use fake buttons that do nothing.

Where an external API requires credentials, implement an integration-ready architecture and a clearly labelled demo/mock fallback.

Build the application incrementally but make sure the final result is a complete working prototype.

Start by creating the complete application architecture, database schema and main UI, then implement authentication, profiles, skills, matching, connections, sessions, coins, marketplace, ratings, notifications and the exchange-cycle demonstration.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e292a5a4-28d8-4f7e-af8d-0a640b208bfa).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
