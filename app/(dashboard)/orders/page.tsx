'use client';

import { useOrders, useCancelOrder } from '@/hooks/useOrders';
import { AlertCircle, RefreshCw, X, Loader2 } from 'lucide-react';

export default function OrdersPage() {
  const { data, isLoading, error, refetch, isFetching } = useOrders();
  const cancelOrder = useCancelOrder();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Orders</h1>
          <p className="text-muted-foreground">
            Manage your open and filled orders
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive mb-8">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load orders. Please try again.</span>
        </div>
      )}

      {/* Orders Table */}
      {isLoading ? (
        <div className="bg-card border border-border rounded-lg p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </div>
      ) : data?.orders && data.orders.length > 0 ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 text-sm font-medium">Market</th>
                <th className="text-left p-4 text-sm font-medium">Side</th>
                <th className="text-right p-4 text-sm font-medium">Price</th>
                <th className="text-right p-4 text-sm font-medium">Size</th>
                <th className="text-right p-4 text-sm font-medium">Filled</th>
                <th className="text-center p-4 text-sm font-medium">Status</th>
                <th className="text-center p-4 text-sm font-medium">Type</th>
                <th className="text-center p-4 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="p-4 text-sm truncate max-w-[200px]">
                    {order.outcome || order.market}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-sm font-medium ${
                        order.side === 'BUY' ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {order.side}
                    </span>
                  </td>
                  <td className="p-4 text-right text-sm font-mono">
                    {(parseFloat(order.price) * 100).toFixed(1)}¢
                  </td>
                  <td className="p-4 text-right text-sm font-mono">
                    {parseFloat(order.original_size).toFixed(0)}
                  </td>
                  <td className="p-4 text-right text-sm font-mono">
                    {parseFloat(order.size_matched).toFixed(0)}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`
                        text-xs font-medium px-2 py-1 rounded
                        ${order.status === 'live' ? 'bg-success/10 text-success' : ''}
                        ${order.status === 'matched' ? 'bg-primary/10 text-primary' : ''}
                        ${order.status === 'cancelled' ? 'bg-muted text-muted-foreground' : ''}
                      `}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-center text-sm text-muted-foreground">
                    {order.order_type}
                  </td>
                  <td className="p-4 text-center">
                    {order.status === 'live' && (
                      <button
                        onClick={() => cancelOrder.mutate(order.id)}
                        disabled={cancelOrder.isPending}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Cancel order"
                      >
                        {cancelOrder.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">
            No orders found. Place an order to see it here.
          </p>
        </div>
      )}
    </div>
  );
}
