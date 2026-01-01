/**
 * Hook for optimistic updates with rollback support
 * Inspired by TanStack Query's optimistic update pattern
 */
import { useState, useCallback, useRef } from 'react'

/**
 * useOptimistic hook for instant UI updates with rollback
 * 
 * @param {any} initialValue - Initial state value
 * @param {Function} updateFn - Async function to perform the actual update
 * @returns {Object} - { value, optimisticValue, update, isPending, error }
 * 
 * @example
 * const { value, optimisticValue, update, isPending } = useOptimistic(
 *   bug,
 *   async (newStatus) => {
 *     await updateBugStatus(bug.id, newStatus)
 *   }
 * )
 * 
 * // Use optimisticValue for display
 * <span>{optimisticValue.status}</span>
 * 
 * // Call update with new value and optimistic value
 * update(
 *   { ...bug, status: 'Resolved' },
 *   async () => await updateBugStatus(bug.id, 'Resolved')
 * )
 */
export function useOptimistic(initialValue) {
  const [value, setValue] = useState(initialValue)
  const [optimisticValue, setOptimisticValue] = useState(initialValue)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)
  
  const previousValueRef = useRef(initialValue)

  const update = useCallback(async (newOptimisticValue, asyncUpdateFn) => {
    // Store current value for rollback
    previousValueRef.current = optimisticValue
    
    // Immediately update optimistic value
    setOptimisticValue(newOptimisticValue)
    setIsPending(true)
    setError(null)

    try {
      // Perform the actual async operation
      const result = await asyncUpdateFn()
      
      // Update both values on success
      const finalValue = result !== undefined ? result : newOptimisticValue
      setValue(finalValue)
      setOptimisticValue(finalValue)
      
      return { success: true, data: finalValue }
    } catch (err) {
      // Rollback on error
      setOptimisticValue(previousValueRef.current)
      setError(err)
      
      return { success: false, error: err }
    } finally {
      setIsPending(false)
    }
  }, [optimisticValue])

  const reset = useCallback(() => {
    setOptimisticValue(value)
    setError(null)
    setIsPending(false)
  }, [value])

  const setInitialValue = useCallback((newValue) => {
    setValue(newValue)
    setOptimisticValue(newValue)
    previousValueRef.current = newValue
  }, [])

  return {
    value,
    optimisticValue,
    update,
    isPending,
    error,
    reset,
    setInitialValue,
  }
}

/**
 * useOptimisticList hook for lists with add/remove/update operations
 */
export function useOptimisticList(initialItems = []) {
  const [items, setItems] = useState(initialItems)
  const [optimisticItems, setOptimisticItems] = useState(initialItems)
  const [pendingIds, setPendingIds] = useState(new Set())
  const [errors, setErrors] = useState(new Map())

  const previousItemsRef = useRef(initialItems)

  // Add item optimistically
  const addItem = useCallback(async (newItem, asyncAddFn) => {
    const tempId = newItem.id || `temp-${Date.now()}`
    const itemWithId = { ...newItem, id: tempId }
    
    previousItemsRef.current = optimisticItems
    setOptimisticItems(prev => [...prev, itemWithId])
    setPendingIds(prev => new Set([...prev, tempId]))

    try {
      const result = await asyncAddFn()
      const finalItem = result || itemWithId
      
      setItems(prev => [...prev, finalItem])
      setOptimisticItems(prev => 
        prev.map(item => item.id === tempId ? finalItem : item)
      )
      
      return { success: true, data: finalItem }
    } catch (err) {
      setOptimisticItems(previousItemsRef.current)
      setErrors(prev => new Map([...prev, [tempId, err]]))
      return { success: false, error: err }
    } finally {
      setPendingIds(prev => {
        const next = new Set(prev)
        next.delete(tempId)
        return next
      })
    }
  }, [optimisticItems])

  // Remove item optimistically
  const removeItem = useCallback(async (itemId, asyncRemoveFn) => {
    previousItemsRef.current = optimisticItems
    setOptimisticItems(prev => prev.filter(item => item.id !== itemId))
    setPendingIds(prev => new Set([...prev, itemId]))

    try {
      await asyncRemoveFn()
      setItems(prev => prev.filter(item => item.id !== itemId))
      return { success: true }
    } catch (err) {
      setOptimisticItems(previousItemsRef.current)
      setErrors(prev => new Map([...prev, [itemId, err]]))
      return { success: false, error: err }
    } finally {
      setPendingIds(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }, [optimisticItems])

  // Update item optimistically
  const updateItem = useCallback(async (itemId, updates, asyncUpdateFn) => {
    previousItemsRef.current = optimisticItems
    setOptimisticItems(prev => 
      prev.map(item => item.id === itemId ? { ...item, ...updates } : item)
    )
    setPendingIds(prev => new Set([...prev, itemId]))

    try {
      const result = await asyncUpdateFn()
      const finalUpdates = result || updates
      
      setItems(prev => 
        prev.map(item => item.id === itemId ? { ...item, ...finalUpdates } : item)
      )
      setOptimisticItems(prev => 
        prev.map(item => item.id === itemId ? { ...item, ...finalUpdates } : item)
      )
      
      return { success: true, data: finalUpdates }
    } catch (err) {
      setOptimisticItems(previousItemsRef.current)
      setErrors(prev => new Map([...prev, [itemId, err]]))
      return { success: false, error: err }
    } finally {
      setPendingIds(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }, [optimisticItems])

  const isPending = useCallback((itemId) => pendingIds.has(itemId), [pendingIds])
  const getError = useCallback((itemId) => errors.get(itemId), [errors])
  const clearError = useCallback((itemId) => {
    setErrors(prev => {
      const next = new Map(prev)
      next.delete(itemId)
      return next
    })
  }, [])

  const setInitialItems = useCallback((newItems) => {
    setItems(newItems)
    setOptimisticItems(newItems)
    previousItemsRef.current = newItems
  }, [])

  return {
    items,
    optimisticItems,
    addItem,
    removeItem,
    updateItem,
    isPending,
    getError,
    clearError,
    pendingCount: pendingIds.size,
    setInitialItems,
  }
}

export default useOptimistic
