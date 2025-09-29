"use client";

import type React from "react";

import {
  Plus,
  Trash2,
  Edit3,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Transaction {
  id: string;
  name: string;
  date: string;
  amount: number;
  icon: string;
  category: "Meta" | "Dívida";
  installment: "mensal" | "única";
}

export default function BankingApp() {
  const [salary, setSalary] = useState(1518.98);
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState(salary.toString());

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransactionForm, setNewTransactionForm] = useState({
    name: "",
    amount: "",
    date: "",
    category: "Dívida" as "Dívida" | "Meta",
    installment: "única" as "mensal" | "única",
  });

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      name: "Casamento",
      date: "05/05/2026",
      amount: 8000,
      icon: "C",
      category: "Meta",
      installment: "única",
    },
    {
      id: "2",
      name: "Faculdade",
      date: "23/08/2025",
      amount: 128.9,
      icon: "F",
      category: "Dívida",
      installment: "mensal",
    },
    {
      id: "3",
      name: "Spotify",
      date: "12/09/2025",
      amount: 11.99,
      icon: "S",
      category: "Dívida",
      installment: "mensal",
    },
    {
      id: "4",
      name: "Parcela Notebook",
      date: "15/12/2027",
      amount: 300,
      icon: "PN",
      category: "Dívida",
      installment: "mensal",
    },
    {
      id: "5",
      name: "Cartão de Crédito",
      date: "30/11/2024",
      amount: 450.5,
      icon: "CC",
      category: "Dívida",
      installment: "mensal",
    },
    {
      id: "6",
      name: "Viagem SP",
      date: "10/06/2025",
      amount: 6000,
      icon: "V",
      category: "Meta",
      installment: "única",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Set<string>>(new Set(["Todos"]));
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    amount: "",
    date: "",
    installment: "única" as "mensal" | "única",
  });

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const salaryLongPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const transactionsSectionRef = useRef<HTMLDivElement>(null);

  const formatDateInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(
        4,
        8
      )}`;
    }
  };

  const calculations = useMemo(() => {
    const debts = transactions
      .filter((t) => t.category === "Dívida")
      .reduce((sum, t) => sum + t.amount, 0);

    const goals = transactions
      .filter((t) => t.category === "Meta")
      .reduce((sum, t) => sum + t.amount, 0);

    const remaining = salary - (debts + goals);

    return { debts, goals, remaining };
  }, [transactions, salary]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (!filters.has("Todos")) {
      // Apply category filters (Dívidas or Metas)
      const hasDebtFilter = filters.has("Dívidas");
      const hasGoalFilter = filters.has("Metas");

      if (hasDebtFilter && !hasGoalFilter) {
        filtered = filtered.filter((t) => t.category === "Dívida");
      } else if (hasGoalFilter && !hasDebtFilter) {
        filtered = filtered.filter((t) => t.category === "Meta");
      }
      // If both or neither are selected, show all categories

      // Apply installment filters (Parcela Única or Parcela Mensal)
      const hasUniqueFilter = filters.has("Parcela Única");
      const hasMonthlyFilter = filters.has("Parcela Mensal");

      if (hasUniqueFilter && !hasMonthlyFilter) {
        filtered = filtered.filter((t) => t.installment === "única");
      } else if (hasMonthlyFilter && !hasUniqueFilter) {
        filtered = filtered.filter((t) => t.installment === "mensal");
      }
      // If both or neither are selected, show all installments
    }

    return filtered;
  }, [transactions, searchTerm, filters]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = currentPage * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentPage < totalPages - 1) {
      handleNextPage();
    }
    if (isRightSwipe && currentPage > 0) {
      handlePrevPage();
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleSalaryLongPressStart = () => {
    salaryLongPressTimer.current = setTimeout(() => {
      setIsEditingSalary(true);
      setSalaryInput(salary.toString());
    }, 2000);
  };

  const handleSalaryLongPressEnd = () => {
    if (salaryLongPressTimer.current) {
      clearTimeout(salaryLongPressTimer.current);
      salaryLongPressTimer.current = null;
    }
  };

  const handleSalarySave = () => {
    const newSalary = Number.parseFloat(salaryInput);
    if (!isNaN(newSalary) && newSalary > 0) {
      setSalary(newSalary);
    }
    setIsEditingSalary(false);
  };

  const handleSalaryCancel = () => {
    setIsEditingSalary(false);
    setSalaryInput(salary.toString());
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const handleLongPressStart = (transaction: Transaction) => {
    longPressTimer.current = setTimeout(() => {
      setSelectedTransaction(transaction);
      setEditForm({
        name: transaction.name,
        amount: transaction.amount.toString(),
        date: transaction.date,
        installment: transaction.installment,
      });
      setShowModal(true);
    }, 1000);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDelete = () => {
    if (selectedTransaction) {
      setTransactions((prev) =>
        prev.filter((t) => t.id !== selectedTransaction.id)
      );
      setShowModal(false);
      setSelectedTransaction(null);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (selectedTransaction) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === selectedTransaction.id
            ? {
                ...t,
                name: editForm.name,
                amount: Number.parseFloat(editForm.amount) || 0,
                date: editForm.date,
                installment: editForm.installment,
              }
            : t
        )
      );
      setShowModal(false);
      setSelectedTransaction(null);
      setIsEditing(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTransaction(null);
    setIsEditing(false);
  };

  const handleViewAllTransactions = () => {
    console.log("View all transactions");
  };

  const handleAddTransaction = () => {
    setShowAddModal(true);
    setNewTransactionForm({
      name: "",
      amount: "",
      date: "",
      category: "Dívida",
      installment: "única",
    });
  };

  const handleSaveNewTransaction = () => {
    if (newTransactionForm.name && newTransactionForm.amount) {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        name: newTransactionForm.name,
        date: newTransactionForm.date || new Date().toLocaleDateString("pt-BR"),
        amount: Number.parseFloat(newTransactionForm.amount) || 0,
        icon: newTransactionForm.name.charAt(0).toUpperCase(),
        category: newTransactionForm.category,
        installment: newTransactionForm.installment,
      };

      setTransactions((prev) => [...prev, newTransaction]);
      setShowAddModal(false);
      setNewTransactionForm({
        name: "",
        amount: "",
        date: "",
        category: "Dívida",
        installment: "única",
      });
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setNewTransactionForm({
      name: "",
      amount: "",
      date: "",
      category: "Dívida",
      installment: "única",
    });
  };

  return (
    <div className="relative min-h-screen text-foreground">
      <div className="mx-auto max-w-sm bg-transparent min-h-screen">
        <div className="flex items-center justify-between p-6 pt-12">
          <div>
            <p className="text-sm text-muted-foreground">Bem-vindo de volta </p>
            <h1 className="text-lg font-semibold text-foreground">
              José Lucas{" "}
            </h1>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full bg-transparent"
            onClick={handleAddTransaction}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-6 pb-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {"Salário do mês"}
          </p>
          {isEditingSalary ? (
            <div className="flex items-center justify-center space-x-2">
              <Input
                type="number"
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                className="text-4xl font-bold text-center bg-transparent border-b border-primary w-48"
                autoFocus
              />
              <Button size="sm" onClick={handleSalarySave}>
                ✓
              </Button>
              <Button size="sm" variant="outline" onClick={handleSalaryCancel}>
                ✗
              </Button>
            </div>
          ) : (
            <h2
              className="text-4xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors select-none"
              onMouseDown={handleSalaryLongPressStart}
              onMouseUp={handleSalaryLongPressEnd}
              onMouseLeave={handleSalaryLongPressEnd}
              onTouchStart={handleSalaryLongPressStart}
              onTouchEnd={handleSalaryLongPressEnd}
            >
              ${salary.toFixed(2)}
            </h2>
          )}
        </div>

        <Card className="flex flex-row items-center justify-around text-sm text-muted-foreground bg-transparent py-4 mx-6 mb-6 h-18 shadow-md">
          <div className="flex-1 text-center px-2">
            <p className="text-sm sm:text-lg font-semibold text-foreground truncate">
              ${calculations.debts.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Dívidas</p>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex-1 text-center px-2">
            <p className="text-sm sm:text-lg font-semibold text-foreground truncate">
              ${calculations.goals.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Metas</p>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex-1 text-center px-2">
            <p
              className={`text-sm sm:text-lg font-semibold truncate ${
                calculations.remaining >= 0
                  ? "text-green-500"
                  : "text-[#A31621]"
              }`}
            >
              ${calculations.remaining.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Restante</p>
          </div>
        </Card>

        <div className="px-6 mb-4 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-transparent border-secondary/30 shadow-inner"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilterModal(true)}
              className="h-10 w-10 bg-transparent border-secondary/30"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {!filters.has("Todos") && filters.size > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {Array.from(filters).map((filter) => (
                  <Badge key={filter} variant="secondary" className="text-xs">
                    {filter}
                  </Badge>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters(new Set(["Todos"]))}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>

        <div className="px-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Resumo</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage + 1} / {totalPages || 1}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            className="space-y-4"
            ref={transactionsSectionRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {paginatedTransactions.map((transaction) => (
              <Card
                key={transaction.id}
                className="bg-transparent hover:border-secondary/10 transition-all cursor-pointer select-none"
                onMouseDown={() => handleLongPressStart(transaction)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={() => handleLongPressStart(transaction)}
                onTouchEnd={handleLongPressEnd}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {transaction.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground text-sm">
                          {transaction.name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {transaction.date}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs px-2 py-0 ${
                              transaction.installment === "mensal"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-green-500/10 text-green-400 border-green-500/20"
                            }`}
                          >
                            {transaction.installment}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col items-end space-y-1">
                        <span className="font-semibold text-foreground">
                          ${transaction.amount.toFixed(2)}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            transaction.category === "Meta"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {transaction.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {paginatedTransactions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma transação encontrada
              </p>
            </div>
          )}
        </div>

        <div className="h-20"></div>
      </div>

      <Dialog open={showModal} onOpenChange={handleCloseModal}>
        <DialogContent className="w-full max-w-sm bg-default/90 backdrop-blur-md border border-secondary/30 shadow-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Transação" : "Opções"}
            </DialogTitle>
          </DialogHeader>

          {!isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {selectedTransaction?.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {selectedTransaction?.name}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline">
                      ${selectedTransaction?.amount.toFixed(2)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        selectedTransaction?.installment === "mensal"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-green-500/10 text-green-400 border-green-500/20"
                      }`}
                    >
                      {selectedTransaction?.installment}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex space-x-3">
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  className="flex-1 bg-transparent"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
                <Button onClick={handleEdit} className="flex-1">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="bg-transparent mt-1 border-b border-secondary/30 focus:outline-none focus:ring-0 focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="bg-transparent mt-1 border-b border-secondary/30 focus:outline-none focus:ring-0 focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="text"
                  value={editForm.date}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      date: formatDateInput(e.target.value),
                    }))
                  }
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                  className="bg-transparent mt-1 border-b border-secondary/30 focus:outline-none focus:ring-0 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label>Parcela</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={
                      editForm.installment === "única" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setEditForm((prev) => ({ ...prev, installment: "única" }))
                    }
                    className="flex-1"
                  >
                    Única
                  </Button>
                  <Button
                    variant={
                      editForm.installment === "mensal" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setEditForm((prev) => ({
                        ...prev,
                        installment: "mensal",
                      }))
                    }
                    className="flex-1"
                  >
                    Mensal
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex space-x-3">
                <Button
                  onClick={handleCloseModal}
                  variant="outline"
                  className="flex-1 bg-transparent"
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} className="flex-1">
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className="w-full max-w-sm bg-default/90 backdrop-blur-md border border-secondary/30 shadow-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>Filtrar Transações</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {[
              "Todos",
              "Dívidas",
              "Metas",
              "Parcela Única",
              "Parcela Mensal",
            ].map((filterOption) => {
              const isSelected = filters.has(filterOption);
              const isDisabled =
                (filterOption === "Dívidas" && filters.has("Metas")) ||
                (filterOption === "Metas" && filters.has("Dívidas")) ||
                (filterOption === "Parcela Única" &&
                  filters.has("Parcela Mensal")) ||
                (filterOption === "Parcela Mensal" &&
                  filters.has("Parcela Única"));

              return (
                <Button
                  key={filterOption}
                  variant={isSelected ? "default" : "outline"}
                  className={`w-full justify-start ${
                    isDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;

                    const newFilters = new Set(filters);

                    if (filterOption === "Todos") {
                      setFilters(new Set(["Todos"]));
                    } else {
                      newFilters.delete("Todos");

                      if (isSelected) {
                        newFilters.delete(filterOption);
                        if (newFilters.size === 0) {
                          newFilters.add("Todos");
                        }
                      } else {
                        newFilters.add(filterOption);
                      }

                      setFilters(newFilters);
                    }

                    setCurrentPage(0);
                  }}
                >
                  {filterOption}
                </Button>
              );
            })}
          </div>

          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => setShowFilterModal(false)}
            >
              Aplicar Filtros
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddModal} onOpenChange={handleCloseAddModal}>
        <DialogContent className="w-full max-w-sm bg-default/90 backdrop-blur-md border border-secondary/30 shadow-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Nome</Label>
              <Input
                id="new-name"
                type="text"
                value={newTransactionForm.name}
                onChange={(e) =>
                  setNewTransactionForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Ex: Netflix, Carro, etc."
                className="bg-transparent mt-1 border-b border-secondary/30 focus:outline-none focus:ring-0 focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-amount">Valor</Label>
              <Input
                id="new-amount"
                type="number"
                value={newTransactionForm.amount}
                onChange={(e) =>
                  setNewTransactionForm((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                placeholder="0.00"
                className="bg-transparent mt-1 border-b border-secondary/30 focus:outline-none focus:ring-0 focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-date">Data</Label>
              <Input
                id="new-date"
                type="text"
                value={newTransactionForm.date}
                onChange={(e) =>
                  setNewTransactionForm((prev) => ({
                    ...prev,
                    date: formatDateInput(e.target.value),
                  }))
                }
                placeholder="dd/mm/aaaa"
                maxLength={10}
                className="bg-transparent mt-1 border-b border-secondary/30 focus:outline-none focus:ring-0 focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <div className="flex space-x-2">
                <Button
                  variant={
                    newTransactionForm.category === "Dívida"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setNewTransactionForm((prev) => ({
                      ...prev,
                      category: "Dívida",
                    }))
                  }
                  className="flex-1"
                >
                  Dívida
                </Button>
                <Button
                  variant={
                    newTransactionForm.category === "Meta"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setNewTransactionForm((prev) => ({
                      ...prev,
                      category: "Meta",
                    }))
                  }
                  className="flex-1"
                >
                  Meta
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Parcela</Label>
              <div className="flex space-x-2">
                <Button
                  variant={
                    newTransactionForm.installment === "única"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setNewTransactionForm((prev) => ({
                      ...prev,
                      installment: "única",
                    }))
                  }
                  className="flex-1"
                >
                  Única
                </Button>
                <Button
                  variant={
                    newTransactionForm.installment === "mensal"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setNewTransactionForm((prev) => ({
                      ...prev,
                      installment: "mensal",
                    }))
                  }
                  className="flex-1"
                >
                  Mensal
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex space-x-3">
              <Button
                onClick={handleCloseAddModal}
                variant="outline"
                className="flex-1 bg-transparent"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveNewTransaction}
                className="flex-1"
                disabled={
                  !newTransactionForm.name || !newTransactionForm.amount
                }
              >
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
