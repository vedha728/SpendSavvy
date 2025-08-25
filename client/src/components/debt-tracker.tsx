import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowUp, ArrowDown, Scale, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { insertDebtSchema, debtTypes } from "@shared/schema";
import type { InsertDebt, Debt } from "@shared/schema";

export default function DebtTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ["/api/debts"],
    queryFn: () => api.debts.getAll(),
  });

  const form = useForm<InsertDebt>({
    resolver: zodResolver(insertDebtSchema),
    defaultValues: {
      friendName: "",
      amount: "",
      type: "I_OWE_THEM",
      description: "",
      isSettled: "false",
    },
  });

  const createDebtMutation = useMutation({
    mutationFn: api.debts.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/debts"] });
      form.reset();
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Debt record added successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add debt record. Please try again.",
        variant: "destructive",
      });
    },
  });

  const settleDebtMutation = useMutation({
    mutationFn: api.debts.settle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/debts"] });
      toast({
        title: "Success",
        description: "Debt settled successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to settle debt. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteDebtMutation = useMutation({
    mutationFn: api.debts.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/debts"] });
      toast({
        title: "Success",
        description: "Debt record deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete debt record. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertDebt) => {
    createDebtMutation.mutate(data);
  };

  // Calculate debt statistics
  const activeDebts = debts.filter(debt => debt.isSettled === "false");
  const youOweAmount = activeDebts
    .filter(debt => debt.type === "I_OWE_THEM")
    .reduce((sum, debt) => sum + parseFloat(debt.amount), 0);
  const owedToYouAmount = activeDebts
    .filter(debt => debt.type === "THEY_OWE_ME")
    .reduce((sum, debt) => sum + parseFloat(debt.amount), 0);
  const netBalance = owedToYouAmount - youOweAmount;

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debt Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* You Owe */}
        <div className="bg-red-50 rounded-xl shadow-sm p-6 border border-red-100" data-testid="you-owe">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <ArrowUp className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-700">You Owe</p>
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">
            ₹{youOweAmount.toFixed(0)}
          </div>
        </div>

        {/* Owed to You */}
        <div className="bg-green-50 rounded-xl shadow-sm p-6 border border-green-100" data-testid="owed-to-you">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowDown className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Owed to You</p>
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-green-600">
            ₹{owedToYouAmount.toFixed(0)}
          </div>
        </div>

        {/* Net Balance */}
        <div className="bg-blue-50 rounded-xl shadow-sm p-6 border border-blue-100" data-testid="net-balance">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Scale className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Net Balance</p>
              </div>
            </div>
          </div>
          <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netBalance >= 0 ? '+' : ''}₹{netBalance.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Active Debts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Active Debts & Loans</h3>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-add-debt">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Debt
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]" data-testid="debt-modal">
                <DialogHeader>
                  <DialogTitle>Track Debt</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="friendName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Friend's Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter friend's name" 
                              {...field}
                              data-testid="input-friend-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Debt Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-debt-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {debtTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter amount" 
                              {...field}
                              data-testid="input-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="What was this for?" 
                              {...field}
                              data-testid="input-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="flex-1"
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        disabled={createDebtMutation.isPending}
                        data-testid="button-add-debt-submit"
                      >
                        {createDebtMutation.isPending ? "Adding..." : "Add Debt"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="p-6">
          {activeDebts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active debts. Add a debt record to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {activeDebts.map((debt) => (
                <div
                  key={debt.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                  data-testid={`debt-item-${debt.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        debt.type === "I_OWE_THEM" ? "bg-red-100" : "bg-green-100"
                      }`}>
                        {debt.type === "I_OWE_THEM" ? (
                          <ArrowUp className="h-4 w-4 text-red-500" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{debt.friendName}</h4>
                        <p className="text-sm text-gray-600">{debt.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(debt.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`text-lg font-bold ${
                      debt.type === "I_OWE_THEM" ? "text-red-600" : "text-green-600"
                    }`}>
                      ₹{parseFloat(debt.amount).toFixed(0)}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => settleDebtMutation.mutate(debt.id)}
                        disabled={settleDebtMutation.isPending}
                        data-testid={`button-settle-${debt.id}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteDebtMutation.mutate(debt.id)}
                        disabled={deleteDebtMutation.isPending}
                        data-testid={`button-delete-${debt.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}