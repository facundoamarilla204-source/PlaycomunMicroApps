'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Expense, ExpenseInsert, ExpenseUpdate } from './types';
import { User } from '@supabase/supabase-js';

export function useExpenses(user: User | null) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const fetchExpenses = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      console.error(error);
    } else {
      setExpenses(data || []);
    }
    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = async (expense: Omit<ExpenseInsert, 'user_id'>) => {
    if (!user) {
      // Store in session storage to restore after login
      sessionStorage.setItem('pending_expense', JSON.stringify(expense));
      router.push('/ingresar?redirect=/herramientas/control-gastos');
      return { success: false, redirect: true };
    }

    const newExpense: ExpenseInsert = {
      ...expense,
      user_id: user.id
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert(newExpense)
      .select()
      .single();

    if (error) {
      console.error('Error adding expense:', error);
      return { success: false, error: error.message };
    }

    setExpenses(prev => [data, ...prev].sort((a, b) => {
      if (a.expense_date === b.expense_date) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime();
    }));
    return { success: true, data };
  };

  const updateExpense = async (id: string, updates: ExpenseUpdate) => {
    if (!user) return { success: false, error: 'Debes iniciar sesión' };

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      return { success: false, error: error.message };
    }

    setExpenses(prev => prev.map(e => e.id === id ? data : e).sort((a, b) => {
      if (a.expense_date === b.expense_date) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime();
    }));
    return { success: true, data };
  };

  const deleteExpense = async (id: string) => {
    if (!user) return { success: false, error: 'Debes iniciar sesión' };

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting expense:', error);
      return { success: false, error: error.message };
    }

    setExpenses(prev => prev.filter(e => e.id !== id));
    return { success: true };
  };

  // Restore pending expense after login
  useEffect(() => {
    if (user) {
      const pending = sessionStorage.getItem('pending_expense');
      if (pending) {
        try {
          const expense = JSON.parse(pending);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          addExpense(expense).then(res => {
            if (res.success) {
              sessionStorage.removeItem('pending_expense');
            }
          });
        } catch (e) {
          console.error('Failed to parse pending expense');
          sessionStorage.removeItem('pending_expense');
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return {
    expenses,
    isLoading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    refresh: fetchExpenses
  };
}
