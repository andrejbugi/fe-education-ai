## Best things to add now

### 1. Login screen

Very useful even with mock auth.

Have:

* **Е-пошта**
* **Лозинка**
* **Најава**
* link: **Ја заборавив лозинката**
* maybe mock role switch for demo:

  * **Ученик**
  * **Наставник**

This makes the app feel real immediately.

---

### 2. School selection

Yes, good idea.

You can do:

* dropdown: **Училиште**
* only for the teachers

For MVP FE:

* hardcoded schools in dropdown
* save selected school in localStorage too

---

### 3. Onboarding / first screen

After login, show a simple welcome/setup flow:

* Teacher or Student

If teacher 

* Одбери училиште
* Продолжи

If student

* Продолжи

and then enter email / password

Very useful for demoing flow.

---

### 4. Homework details page

Not just dashboard + workspace.

Add a page for:

* task details
* instructions
* deadline
* attached material
* start button

Flow:
**Dashboard → Task details → Workspace → Finish**

This is very good before BE.

---

### 5. Submission result / completion state

After finishing task:

* **Успешно предадено**
* **Следна задача**
* **Назад на почетна**

This helps show the full student journey.

---

### 6. Notifications page

Simple but valuable.

Examples:

* New homework assigned
* Teacher comment
* Grade posted
* Reminder for deadline

---

### 7. Empty states

Very important for FE polish.

Examples:

* **Нема активни задачи**
* **Нема известувања**
* **Нема рокови за денес**

Makes the UI look much more complete.

---

### 8. Loading / transition states

Even mocked:

* skeleton cards
* loading spinner
* smooth page transitions

This helps the prototype feel much better.

---

## My recommendation for order

Before BE, I’d add these in this order:

1. **Login screen**
2. **School / class selection**
3. **Task details page**
4. **Workspace flow**
5. **Calendar page**
6. **Profile page**
7. **Notifications**
8. **Empty/loading states**

---

## Simple FE flow I’d suggest

**Најава**
→ **Избор на училиште**
→ **Контролна табла**
→ **Детали за задача**
→ **Работен простор**
→ **Резултат / предавање**

That is a very strong prototype already.

