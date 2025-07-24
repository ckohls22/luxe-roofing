"use client";

import { useEffect, useState } from "react";
import { IconTrendingDown, IconTrendingUp, IconLoader2 } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

type QuoteData = {
  id: string;
  quoteNumber: string;
  materialCost: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  formId?: string;
  materialId?: string;
  supplierId?: string;
  customerName?: string;
  customerEmail?: string;
  materialType?: string;
  supplierName?: string;
};

type LeadData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roofType: string;
  createdAt: string;
  addressCount?: number;
  status?: string;
};

type KpiData = {
  totalRevenue: number;
  revenueChange: number;
  newLeads: number;
  leadsChange: number;
  acceptedQuotes: number;
  quotesChange: number;
  conversionRate: number;
  conversionChange: number;
};

export function SectionCards() {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchKpiData() {
      try {
        setLoading(true);
        
        // Fetch quotes data with error handling
        let quotes = [];
        try {
          const quotesRes = await fetch('/api/admin/quote?limit=1000');
          const quotesData = await quotesRes.json();
          if (quotesData && quotesData.data) {
            quotes = quotesData.data;
          }
        } catch (error) {
          console.error("Error fetching quotes data:", error);
        }
        
        // Fetch leads data with error handling
        let leads = [];
        try {
          const leadsRes = await fetch('/api/admin/leads?limit=1000&sortBy=createdAt&sortOrder=desc');
          const leadsData = await leadsRes.json();
          if (leadsData.success) {
            // Use either data or forms property, whichever exists
            leads = leadsData.data || leadsData.forms || [];
          }
        } catch (error) {
          console.error("Error fetching leads data:", error);
        }
        
        // Calculate total revenue (from quotes with materialCost)
        const totalRevenue = quotes.reduce((sum: number, quote: QuoteData) => {
          const cost = parseFloat(quote.materialCost || '0');
          return sum + (isNaN(cost) ? 0 : cost);
        }, 0);
        
        // Calculate revenue change (comparing current month to previous month)
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const currentYear = currentDate.getFullYear();
        const previousYear = previousMonth === 11 ? currentYear - 1 : currentYear;
        
        const currentMonthQuotes = quotes.filter((quote: QuoteData) => {
          const quoteDate = new Date(quote.createdAt);
          return quoteDate.getMonth() === currentMonth && quoteDate.getFullYear() === currentYear;
        });
        
        const previousMonthQuotes = quotes.filter((quote: QuoteData) => {
          const quoteDate = new Date(quote.createdAt);
          return quoteDate.getMonth() === previousMonth && quoteDate.getFullYear() === previousYear;
        });
        
        const currentMonthRevenue = currentMonthQuotes.reduce((sum: number, quote: QuoteData) => {
          const cost = parseFloat(quote.materialCost || '0');
          return sum + (isNaN(cost) ? 0 : cost);
        }, 0);
        
        const previousMonthRevenue = previousMonthQuotes.reduce((sum: number, quote: QuoteData) => {
          const cost = parseFloat(quote.materialCost || '0');
          return sum + (isNaN(cost) ? 0 : cost);
        }, 0);
        
        const revenueChange = previousMonthRevenue === 0
          ? 100
          : ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
        
        // Calculate new leads (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        const recentLeads = leads.filter((lead: LeadData) => {
          const leadDate = new Date(lead.createdAt);
          return leadDate >= thirtyDaysAgo;
        });
        
        const previousPeriodLeads = leads.filter((lead: LeadData) => {
          const leadDate = new Date(lead.createdAt);
          return leadDate >= sixtyDaysAgo && leadDate < thirtyDaysAgo;
        });
        
        const newLeads = recentLeads.length;
        const leadsChange = previousPeriodLeads.length === 0
          ? 100
          : ((newLeads - previousPeriodLeads.length) / previousPeriodLeads.length) * 100;
        
        // Calculate accepted quotes
        const acceptedQuotes = quotes.filter((quote: QuoteData) => quote.status === 'accepted').length;
        const previousAcceptedQuotes = previousMonthQuotes.filter((quote: QuoteData) => quote.status === 'accepted').length;
        
        const quotesChange = previousAcceptedQuotes === 0
          ? 100
          : ((acceptedQuotes - previousAcceptedQuotes) / previousAcceptedQuotes) * 100;
        
        // Calculate conversion rate (accepted quotes / total leads)
        const conversionRate = leads.length === 0 ? 0 : (acceptedQuotes / leads.length) * 100;
        const previousConversionRate = previousPeriodLeads.length === 0 
          ? 0 
          : (previousAcceptedQuotes / previousPeriodLeads.length) * 100;
        
        const conversionChange = previousConversionRate === 0
          ? 100
          : ((conversionRate - previousConversionRate) / previousConversionRate) * 100;
        
        setData({
          totalRevenue,
          revenueChange,
          newLeads,
          leadsChange,
          acceptedQuotes,
          quotesChange,
          conversionRate,
          conversionChange
        });
      } catch (error) {
        console.error("Error fetching KPI data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchKpiData();
  }, []);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card bg-white shadow-lg border-amber-200 hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <CardDescription className="text-amber-800">Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-gray-900">
            {loading ? (
              <div className="flex items-center">
                <IconLoader2 className="animate-spin mr-2 size-5 text-amber-600" />
                Loading...
              </div>
            ) : (
              formatCurrency(data?.totalRevenue || 0)
            )}
          </CardTitle>
          <CardAction>
            {!loading && (
              <Badge 
                variant="outline" 
                className={data?.revenueChange && data.revenueChange >= 0 
                  ? "border-green-200 text-green-700 bg-green-50" 
                  : "border-red-200 text-red-700 bg-red-50"
                }
              >
                {data?.revenueChange && data.revenueChange >= 0 
                  ? <IconTrendingUp className="text-green-600" />
                  : <IconTrendingDown className="text-red-600" />
                }
                {formatPercentage(data?.revenueChange || 0)}
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-gray-900">
            {!loading && (
              data?.revenueChange && data.revenueChange >= 0 
                ? <>Revenue growing this month <IconTrendingUp className="size-4 text-green-600" /></>
                : <>Revenue decreased this month <IconTrendingDown className="size-4 text-red-600" /></>
            )}
          </div>
          <div className="text-amber-700">
            Based on completed quotes
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card bg-white shadow-lg border-amber-200 hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <CardDescription className="text-amber-800">New Leads</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-gray-900">
            {loading ? (
              <div className="flex items-center">
                <IconLoader2 className="animate-spin mr-2 size-5 text-amber-600" />
                Loading...
              </div>
            ) : (
              data?.newLeads || 0
            )}
          </CardTitle>
          <CardAction>
            {!loading && (
              <Badge 
                variant="outline" 
                className={data?.leadsChange && data.leadsChange >= 0 
                  ? "border-green-200 text-green-700 bg-green-50" 
                  : "border-red-200 text-red-700 bg-red-50"
                }
              >
                {data?.leadsChange && data.leadsChange >= 0 
                  ? <IconTrendingUp className="text-green-600" />
                  : <IconTrendingDown className="text-red-600" />
                }
                {formatPercentage(data?.leadsChange || 0)}
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-gray-900">
            {!loading && (
              data?.leadsChange && data.leadsChange >= 0 
                ? <>Increased from last period <IconTrendingUp className="size-4 text-green-600" /></>
                : <>Decreased from last period <IconTrendingDown className="size-4 text-red-600" /></>
            )}
          </div>
          <div className="text-amber-700">
            Based on last 30 days
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card bg-white shadow-lg border-amber-200 hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <CardDescription className="text-amber-800">Accepted Quotes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-gray-900">
            {loading ? (
              <div className="flex items-center">
                <IconLoader2 className="animate-spin mr-2 size-5 text-amber-600" />
                Loading...
              </div>
            ) : (
              data?.acceptedQuotes || 0
            )}
          </CardTitle>
          <CardAction>
            {!loading && (
              <Badge 
                variant="outline" 
                className={data?.quotesChange && data.quotesChange >= 0 
                  ? "border-green-200 text-green-700 bg-green-50" 
                  : "border-red-200 text-red-700 bg-red-50"
                }
              >
                {data?.quotesChange && data.quotesChange >= 0 
                  ? <IconTrendingUp className="text-green-600" />
                  : <IconTrendingDown className="text-red-600" />
                }
                {formatPercentage(data?.quotesChange || 0)}
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-gray-900">
            {!loading && (
              data?.quotesChange && data.quotesChange >= 0 
                ? <>Growing acceptance rate <IconTrendingUp className="size-4 text-green-600" /></>
                : <>Declining acceptance rate <IconTrendingDown className="size-4 text-red-600" /></>
            )}
          </div>
          <div className="text-amber-700">
            Total quotes with accepted status
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card bg-white shadow-lg border-amber-200 hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <CardDescription className="text-amber-800">Conversion Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-gray-900">
            {loading ? (
              <div className="flex items-center">
                <IconLoader2 className="animate-spin mr-2 size-5 text-amber-600" />
                Loading...
              </div>
            ) : (
              `${(data?.conversionRate || 0).toFixed(1)}%`
            )}
          </CardTitle>
          <CardAction>
            {!loading && (
              <Badge 
                variant="outline" 
                className={data?.conversionChange && data.conversionChange >= 0 
                  ? "border-green-200 text-green-700 bg-green-50" 
                  : "border-red-200 text-red-700 bg-red-50"
                }
              >
                {data?.conversionChange && data.conversionChange >= 0 
                  ? <IconTrendingUp className="text-green-600" />
                  : <IconTrendingDown className="text-red-600" />
                }
                {formatPercentage(data?.conversionChange || 0)}
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-gray-900">
            {!loading && (
              data?.conversionChange && data.conversionChange >= 0 
                ? <>Better performance <IconTrendingUp className="size-4 text-green-600" /></>
                : <>Needs improvement <IconTrendingDown className="size-4 text-red-600" /></>
            )}
          </div>
          <div className="text-amber-700">
            Accepted quotes / total leads
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
