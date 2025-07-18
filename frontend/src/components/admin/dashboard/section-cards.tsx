import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card bg-white shadow-lg border-amber-200 hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <CardDescription className="text-amber-800">Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-gray-900">
            $1,250.00
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
              <IconTrendingUp className="text-green-600" />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-gray-900">
            Trending up this month <IconTrendingUp className="size-4 text-green-600" />
          </div>
          <div className="text-amber-700">
            Visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card bg-white shadow-lg border-amber-200 hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <CardDescription className="text-amber-800">New Customers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-gray-900">
            1,234
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
              <IconTrendingDown className="text-red-600" />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-gray-900">
            Down 20% this period <IconTrendingDown className="size-4 text-red-600" />
          </div>
          <div className="text-amber-700">
            Acquisition needs attention
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card bg-white shadow-lg border-amber-200 hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <CardDescription className="text-amber-800">Active Accounts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-gray-900">
            45,678
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
              <IconTrendingUp className="text-green-600" />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-gray-900">
            Strong user retention <IconTrendingUp className="size-4 text-green-600" />
          </div>
          <div className="text-amber-700">Engagement exceed targets</div>
        </CardFooter>
      </Card>
      <Card className="@container/card bg-white shadow-lg border-amber-200 hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <CardDescription className="text-amber-800">Growth Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-gray-900">
            4.5%
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
              <IconTrendingUp className="text-green-600" />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-gray-900">
            Steady performance increase <IconTrendingUp className="size-4 text-green-600" />
          </div>
          <div className="text-amber-700">Meets growth projections</div>
        </CardFooter>
      </Card>
    </div>
  );
}
