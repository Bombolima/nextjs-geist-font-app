Below is the detailed implementation plan for the offline (localStorage-based) financial control system. The plan covers all dependent files, error handling, and UI/UX best practices.

---

## Overview  
We will build a Next.js application with a modern, minimalistic interface using Tailwind CSS. The system will provide a dashboard for overall financial health, a full transactions page for managing records, and modular components to add, edit, and list financial transactions (including dívidas, créditos, débitos, juros, lançamentos futuros, cartão de crédito, investimentos). Data will be stored locally (via localStorage), incorporating robust error handling.

---

## Detailed Implementation Plan

### 1. Data Management & Utility Files

- **File: `src/lib/storage.ts`**  
  - **Purpose:** Provide utility functions to read/write transactions to localStorage.  
  - **Steps:**
    1. Create functions `getTransactions()` and `saveTransactions(transactions: Transaction[])` using `JSON.parse` and `JSON.stringify`.
    2. Wrap storage access in try/catch blocks to gracefully handle any errors.
    3. Export these functions for use in hooks/components.

- **File: `src/hooks/useFinancialData.ts`**  
  - **Purpose:** Create a custom React hook to manage CRUD operations for financial transactions.
  - **Steps:**
    1. Define a TypeScript interface for `Transaction` (fields: `id`, `type`, `description`, `amount`, `interest?`, `date`, and optional `scheduledDate`).
    2. Use `useState` to maintain the transactions list.
    3. Use `useEffect` to load data from localStorage on mount (using the utility functions).
    4. Create functions:  
       - `addTransaction(newTransaction: Transaction)`,  
       - `updateTransaction(updated: Transaction)`,  
       - `deleteTransaction(id: string)`.  
    5. Include try/catch for every operation on localStorage and provide fallback error values.

---

### 2. UI Components

- **File: `src/components/FinancialTransactionForm.tsx`**  
  - **Purpose:** Form for adding or editing a transaction.
  - **Steps:**
    1. Use `react-hook-form` for form management.
    2. Fields: a dropdown for type (options: "Dívida", "Crédito", "Investimento", "Cartão de Crédito", etc.), text input for description, number input for amount, optional interest, date pickers for transaction date and scheduled date.
    3. Validate required fields and display inline error messages.
    4. On submit, call a prop function (e.g., `onSubmit`) with the form data.
    5. Use Tailwind CSS classes for a modern, clean layout and spacing.

- **File: `src/components/TransactionList.tsx`**  
  - **Purpose:** List display of transactions in a table or card layout.
  - **Steps:**
    1. Accept a prop for `transactions` (an array of Transaction objects).
    2. Render each transaction showing: Type, Description, Amount, Dates.
    3. Provide text-based action buttons (“Editar”, “Excluir”) for each row.
    4. Utilize native HTML elements styled with Tailwind CSS to ensure modern typography and spacing.
    5. Incorporate error handling by showing a friendly message if no transactions exist.

- **File: `src/components/FinancialSummary.tsx`**  
  - **Purpose:** Display a summary card of the total amounts and an overview of upcoming scheduled transactions.
  - **Steps:**
    1. Calculate totals (e.g., total dívidas, total créditos) from the passed transactions.
    2. Layout the summary in a card-like component, using clear headings and paragraphs.
    3. Style with Tailwind CSS ensuring proper use of spacing and contrast.
    4. Handle edge cases such as empty data gracefully.

---

### 3. Application Pages

- **File: `src/app/dashboard/page.tsx`**  
  - **Purpose:** Dashboard displaying a financial summary and a list of recent transactions.
  - **Steps:**
    1. Import the custom hook `useFinancialData` to fetch transactions.
    2. Render the `FinancialSummary` at the top.
    3. Below the summary, render the `TransactionList` with a filtered list (e.g., latest transactions).
    4. Include a button “Adicionar Transação” that toggles the display of the `FinancialTransactionForm` (possibly in a modal or in-page form).
    5. Use a modern container layout with Tailwind classes (e.g., `container mx-auto p-4`).
    6. Handle errors from the hook by displaying a user-friendly alert component using the pre-existing `src/components/ui/alert.tsx`.

- **File: `src/app/transactions/page.tsx`**  
  - **Purpose:** Full list view for managing transactions.
  - **Steps:**
    1. Import and use the `useFinancialData` hook to fetch all transactions.
    2. Render the full `TransactionList` and optionally include edit/delete functionality.
    3. Provide in-page navigation or links back to the dashboard.
    4. Use a similar style as the dashboard for a consistent UX.

---

### 4. Global & Navigation Updates

- **File: `src/app/globals.css`**  
  - **Purpose:** Global styles are already defined; review if additional utility classes are needed.
  - **Steps:**
    1. Confirm that spacing, typography, and card styles follow the new design.
    2. Add any custom variants if necessary (e.g., for form input error states).

- **Navigation Integration (if applicable):**  
  - If a layout or navigation component exists (e.g., `src/app/layout.tsx`), add links for “Dashboard” and “Transações”.  
  - Ensure consistency in colors and spacing with the rest of the UI.

---

### 5. Testing & Error Handling

- Validate all localStorage operations with try/catch blocks.
- Manually test the following using the browser:
  - Adding a new transaction via the form.
  - Editing and deleting transactions.
  - Displaying the financial summary and transaction list.
- Ensure the UI remains intact, even if an image or asset fails to load (if any future static assets are added).

---

## Summary
- Created a localStorage-based system with utility files (`src/lib/storage.ts`) and a custom hook (`src/hooks/useFinancialData.ts`) to manage transactions.  
- Developed modular UI components: `FinancialTransactionForm.tsx`, `TransactionList.tsx`, and `FinancialSummary.tsx` to handle adding, listing, and summarizing transactions.  
- Built two main pages: `dashboard/page.tsx` for an overview and `transactions/page.tsx` for full transaction management.  
- Integrated robust error handling and inline validation using `react-hook-form` and try/catch blocks for storage operations.  
- Applied a modern UI design through Tailwind CSS with clear typography, spacing, and layout without reliance on external icon libraries.  
- Navigation updates (if applicable) ensure smooth routing between Dashboard and Transactions views.  
- The plan emphasizes local functionality with future flexibility for API integration.
