"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import { IconLoader2 } from "@tabler/icons-react";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const description = "An interactive chart for leads and quotes";

// Types for our data
type ChartDataPoint = {
  date: string;
  leads: number;
  quotes: number;
  accepted: number;
};

type ChartDataMap = {
  [key: string]: ChartDataPoint;
};

type QuoteData = {
  id: string;
  createdAt: string;
  status: string;
};

type LeadData = {
  id: string;
  createdAt: string;
};


const chartConfig = {
  leads: {
    label: "Leads",
    color: "#f59e0b", // amber-500
  },
  quotes: {
    label: "Quotes",
    color: "#ea580c", // orange-600
  },
  accepted: {
    label: "Accepted Quotes",
    color: "#16a34a", // green-600
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = useState("90d");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  // Fetch leads and quotes data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch quotes with error handling
        let quotes: QuoteData[] = [];
        try {
          const quotesRes = await fetch('/api/admin/quote?limit=1000');
          const quotesData = await quotesRes.json();
          if (quotesData && quotesData.data) {
            quotes = quotesData.data;
          }
        } catch (error) {
          console.error("Error fetching quotes data:", error);
        }
        
        // Fetch leads with error handling
        let leads: LeadData[] = [];
        try {
          const leadsRes = await fetch('/api/admin/leads?limit=1000');
          const leadsData = await leadsRes.json();
          if (leadsData && leadsData.data) {
            leads = leadsData.data;
          } else if (leadsData && leadsData.forms) {
            // Handle original response format
            leads = leadsData.forms;
          }
        } catch (error) {
          console.error("Error fetching leads data:", error);
        }
        
        // Process data for chart if we have any data
        if (quotes.length > 0 || leads.length > 0) {
          processChartData(quotes, leads);
        } else {
          setError('No data available to display');
        }
      } catch (error) {
        console.error('Error processing chart data:', error);
        setError(error as string);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Process data for chart
  const processChartData = (quotes: QuoteData[], leads: LeadData[]) => {
    // Create a map to store data by date
    const dataByDate: ChartDataMap = {};
    
    // Process leads
    leads.forEach(lead => {
      const date = new Date(lead.createdAt);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!dataByDate[dateStr]) {
        dataByDate[dateStr] = {
          date: dateStr,
          leads: 0,
          quotes: 0,
          accepted: 0
        };
      }
      
      dataByDate[dateStr].leads += 1;
    });
    
    // Process quotes
    quotes.forEach(quote => {
      const date = new Date(quote.createdAt);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!dataByDate[dateStr]) {
        dataByDate[dateStr] = {
          date: dateStr,
          leads: 0,
          quotes: 0,
          accepted: 0
        };
      }
      
      dataByDate[dateStr].quotes += 1;
      
      // Check if this quote is accepted
      if (quote.status === 'accepted') {
        dataByDate[dateStr].accepted += 1;
      }
    });
    
    // Convert map to array and sort by date
    const chartData = Object.values(dataByDate).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    setChartData(chartData);
  };

  // Filter data based on selected time range
  const filteredData = React.useMemo(() => {
    if (!chartData.length) return [];
    
    const today = new Date();
    let daysToSubtract = 90;
    
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    
    const startDate = new Date();
    startDate.setDate(today.getDate() - daysToSubtract);
    
    return chartData.filter((item) => {
      const date = new Date(item.date);
      return date >= startDate;
    });
  }, [chartData, timeRange]);

  return (
    <Card className="@container/card bg-white shadow-lg border-amber-200 hover:shadow-xl transition-shadow duration-200">
      <CardHeader>
        <CardTitle>Leads and Quotes Overview</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Lead and quote activity tracking over time
          </span>
          <span className="@[540px]/card:hidden">Activity timeline</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a time range"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="flex items-center justify-center h-[250px] w-full">
            <IconLoader2 className="animate-spin mr-2 size-5 text-amber-600" />
            <span className="text-amber-800">Loading chart data...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[250px] w-full text-red-500">
            {error}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] w-full text-amber-800">
            No data available for the selected time period
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#f59e0b" // amber-500
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="#f59e0b"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillQuotes" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#ea580c" // orange-600
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="#ea580c"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillAccepted" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#16a34a" // green-600
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="#16a34a"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
              />
              <Legend />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value as string).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                      });
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                name="Leads"
                dataKey="leads"
                type="monotone"
                fill="url(#fillLeads)"
                stroke="#f59e0b" // amber-500
                strokeWidth={2}
              />
              <Area
                name="Quotes"
                dataKey="quotes"
                type="monotone"
                fill="url(#fillQuotes)"
                stroke="#ea580c" // orange-600
                strokeWidth={2}
              />
              <Area
                name="Accepted Quotes"
                dataKey="accepted"
                type="monotone"
                fill="url(#fillAccepted)"
                stroke="#16a34a" // green-600
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
