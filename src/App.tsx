import { Fragment, useCallback, useEffect, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee, Transaction } from "./utils/types"

export function App() {
  const { data: employees, loading: employeesLoading, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [modifiedTransactionIds, setModifiedTransactionIds] = useState<Record<string, boolean>>({})

  const loadAllTransactions = useCallback(async () => {
    transactionsByEmployeeUtils.invalidateData()
    await employeeUtils.fetchAll()
    await paginatedTransactionsUtils.fetchAll()
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  // Update the modified transactions map when a transaction approval changes
  const handleTransactionApprovalChange = useCallback((transactionId: string, newValue: boolean) => {
    setModifiedTransactionIds((prev) => ({
      ...prev,
      [transactionId]: newValue,
    }))
  }, [])

  // Apply modifications to transactions fetched from API
  const applyTransactionModifications = useCallback(
    (transactions: Transaction[]): Transaction[] => {
      return transactions.map((transaction) => {
        if (transaction.id in modifiedTransactionIds) {
          return {
            ...transaction,
            approved: modifiedTransactionIds[transaction.id],
          }
        }
        return transaction
      })
    },
    [modifiedTransactionIds]
  )

  useEffect(() => {
    if (transactionsByEmployee) {
      const modifiedTransactions = applyTransactionModifications(transactionsByEmployee)
      setAllTransactions(modifiedTransactions)
    } else if (paginatedTransactions?.data) {
      if (allTransactions.length === 0) {
        const modifiedTransactions = applyTransactionModifications(paginatedTransactions.data)
        setAllTransactions(modifiedTransactions)
      } else {
        // Merge new transactions with existing ones, preserving modifications
        const existingIds = new Set(allTransactions.map((t) => t.id))
        const newTransactions = paginatedTransactions.data.filter((t) => !existingIds.has(t.id))
        const modifiedNewTransactions = applyTransactionModifications(newTransactions)
        setAllTransactions((prev) => [...prev, ...modifiedNewTransactions])
      }
    }
  }, [
    paginatedTransactions?.data,
    transactionsByEmployee,
    applyTransactionModifications,
    allTransactions,
  ])

  useEffect(() => {
    if (employees === null && !employeesLoading) {
      loadAllTransactions()
    }
  }, [employeesLoading, employees, loadAllTransactions])

  const handleViewMoreClick = async () => {
    await paginatedTransactionsUtils.fetchAll()
  }

  const employeeOptions = employees ? [EMPTY_EMPLOYEE, ...employees] : []

  // Apply any modified transaction values to whatever is being displayed
  const displayTransactions = transactionsByEmployee
    ? applyTransactionModifications(transactionsByEmployee)
    : allTransactions

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />
        <hr className="RampBreak--l" />
        <InputSelect<Employee>
          isLoading={employeesLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employeeOptions}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }

            if (newValue.id === EMPTY_EMPLOYEE.id) {
              await loadAllTransactions()
            } else {
              await loadTransactionsByEmployee(newValue.id)
            }
          }}
        />
        <div className="RampBreak--l" />
        <div className="RampGrid">
          <Transactions
            transactions={displayTransactions}
            onApprovalChange={handleTransactionApprovalChange}
          />
          {paginatedTransactions?.nextPage && !transactionsByEmployee && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={handleViewMoreClick}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
