import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from 'lucide-react';
import { PaymentMethod, BankAccount, TransactionLimits } from "@/types/settings.types";

export const PaymentTab: React.FC = () => {
  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "visa",
      lastFour: "4242",
      expiryDate: "12/25",
      isDefault: true,
    },
    {
      id: "2",
      type: "mastercard",
      lastFour: "8888",
      expiryDate: "09/24",
      isDefault: false,
    },
  ]);

  const [bankAccounts] = useState<BankAccount[]>([
    {
      id: "1",
      bankName: "Chase Bank",
      accountType: "checking",
      lastFour: "1234",
      isDefault: true,
    },
    {
      id: "2",
      bankName: "Bank of America",
      accountType: "savings",
      lastFour: "5678",
      isDefault: false,
    },
  ]);

  const [transactionLimits] = useState<TransactionLimits>({
    dailySending: 1000,
    monthlyTransaction: 10000,
    singleTransaction: 500,
  });

  const handleSetDefaultPaymentMethod = (methodId: string) => {
    // TODO: Implement set default payment method
  };

  const handleSetDefaultBankAccount = (accountId: string) => {
    // TODO: Implement set default bank account
  };

  const handleIncreaseLimit = (limitType: keyof TransactionLimits) => {
    // TODO: Implement increase limit functionality
  };

  const getCardIcon = (type: string) => {
    const baseClasses = "p-2 rounded-md";
    if (type === "visa") {
      return <div className={`${baseClasses} bg-blue-100 dark:bg-blue-900/30`}><CreditCard size={20} className="text-blue-600 dark:text-blue-400" /></div>;
    } else if (type === "mastercard") {
      return <div className={`${baseClasses} bg-purple-100 dark:bg-purple-900/30`}><CreditCard size={20} className="text-purple-600 dark:text-purple-400" /></div>;
    }
    return <div className={`${baseClasses} bg-gray-100 dark:bg-gray-700/30`}><CreditCard size={20} className="text-gray-600 dark:text-gray-400" /></div>;
  };

  const getBankIcon = () => {
    return <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-md"><CreditCard size={20} className="text-green-600 dark:text-green-400" /></div>;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="dark:bg-darkBg-card dark:border-darkBorder-light">
          <CardHeader>
            <CardTitle className="dark:text-white">Payment Methods</CardTitle>
            <CardDescription className="dark:text-gray-400">Manage your payment methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethods.map((method) => (
              <div 
                key={method.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  method.isDefault ? 'bg-gray-50 dark:bg-darkBg-main' : 'border dark:border-darkBorder-light'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getCardIcon(method.type)}
                  <div>
                    <p className="font-medium dark:text-gray-200">
                      {method.type === 'visa' ? 'Visa' : 'Mastercard'} ending in {method.lastFour}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Expires {method.expiryDate}</p>
                  </div>
                </div>
                {method.isDefault ? (
                  <Badge>Default</Badge>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSetDefaultPaymentMethod(method.id)}
                  >
                    Set default
                  </Button>
                )}
              </div>
            ))}

            <Button variant="outline" className="w-full dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-gray-800">
              <CreditCard size={16} className="mr-2" />
              Add new payment method
            </Button>
          </CardContent>
        </Card>

        <Card className="dark:bg-darkBg-card dark:border-darkBorder-light">
          <CardHeader>
            <CardTitle className="dark:text-white">Bank Accounts</CardTitle>
            <CardDescription className="dark:text-gray-400">Manage your linked bank accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bankAccounts.map((account) => (
              <div 
                key={account.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  account.isDefault ? 'bg-gray-50 dark:bg-darkBg-main' : 'border dark:border-darkBorder-light'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getBankIcon()}
                  <div>
                    <p className="font-medium dark:text-gray-200">{account.bankName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {account.accountType === 'checking' ? 'Checking' : 'Savings'} account ending in {account.lastFour}
                    </p>
                  </div>
                </div>
                {account.isDefault ? (
                  <Badge>Default</Badge>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSetDefaultBankAccount(account.id)}
                  >
                    Set default
                  </Button>
                )}
              </div>
            ))}

            <Button variant="outline" className="w-full dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-gray-800">
              <CreditCard size={16} className="mr-2" />
              Link new bank account
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-darkBg-card dark:border-darkBorder-light">
        <CardHeader>
          <CardTitle className="dark:text-white">Transaction Limits</CardTitle>
          <CardDescription className="dark:text-gray-400">View and manage your transaction limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border dark:border-darkBorder-light dark:bg-darkBg-main/50">
              <div>
                <p className="font-medium dark:text-gray-200">Daily sending limit</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Maximum amount you can send in a day</p>
              </div>
              <div className="text-right">
                <p className="font-medium dark:text-gray-200">${transactionLimits.dailySending.toLocaleString()}</p>
                <Button 
                  variant="link" 
                  className="text-sm p-0 h-auto text-[#00B512] dark:text-green-400 dark:hover:text-green-300"
                  onClick={() => handleIncreaseLimit('dailySending')}
                >
                  Increase limit
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border dark:border-darkBorder-light dark:bg-darkBg-main/50">
              <div>
                <p className="font-medium dark:text-gray-200">Monthly transaction limit</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Maximum amount you can transact in a month</p>
              </div>
              <div className="text-right">
                <p className="font-medium dark:text-gray-200">${transactionLimits.monthlyTransaction.toLocaleString()}</p>
                <Button 
                  variant="link" 
                  className="text-sm p-0 h-auto text-[#00B512] dark:text-green-400 dark:hover:text-green-300"
                  onClick={() => handleIncreaseLimit('monthlyTransaction')}
                >
                  Increase limit
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border dark:border-darkBorder-light dark:bg-darkBg-main/50">
              <div>
                <p className="font-medium dark:text-gray-200">Single transaction limit</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Maximum amount for a single transaction</p>
              </div>
              <div className="text-right">
                <p className="font-medium dark:text-gray-200">${transactionLimits.singleTransaction.toLocaleString()}</p>
                <Button 
                  variant="link" 
                  className="text-sm p-0 h-auto text-[#00B512] dark:text-green-400 dark:hover:text-green-300"
                  onClick={() => handleIncreaseLimit('singleTransaction')}
                >
                  Increase limit
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Note: Increasing limits may require additional verification of your identity.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};