"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  X,
  RefreshCw,
  FileDown,
  Columns3,
} from "lucide-react"

// Sample data for demonstration
const allUsers = [
  { id: 1, name: "Sarah Wilson", email: "sarah@acme.com", role: "Admin", status: "Active", department: "Engineering", joinDate: "2023-01-15", lastActive: "2 hours ago" },
  { id: 2, name: "Michael Chen", email: "michael@acme.com", role: "Developer", status: "Active", department: "Engineering", joinDate: "2023-03-22", lastActive: "5 mins ago" },
  { id: 3, name: "Emma Davis", email: "emma@acme.com", role: "Designer", status: "Inactive", department: "Design", joinDate: "2022-11-08", lastActive: "3 days ago" },
  { id: 4, name: "James Wilson", email: "james@acme.com", role: "Viewer", status: "Active", department: "Marketing", joinDate: "2023-06-01", lastActive: "1 hour ago" },
  { id: 5, name: "Olivia Brown", email: "olivia@acme.com", role: "Developer", status: "Pending", department: "Engineering", joinDate: "2024-01-10", lastActive: "Just now" },
  { id: 6, name: "William Taylor", email: "william@acme.com", role: "Manager", status: "Active", department: "Sales", joinDate: "2022-05-15", lastActive: "30 mins ago" },
  { id: 7, name: "Sophia Martinez", email: "sophia@acme.com", role: "Designer", status: "Active", department: "Design", joinDate: "2023-08-20", lastActive: "1 day ago" },
  { id: 8, name: "Benjamin Lee", email: "benjamin@acme.com", role: "Developer", status: "Inactive", department: "Engineering", joinDate: "2022-09-12", lastActive: "1 week ago" },
  { id: 9, name: "Isabella Garcia", email: "isabella@acme.com", role: "Admin", status: "Active", department: "Operations", joinDate: "2023-02-28", lastActive: "4 hours ago" },
  { id: 10, name: "Lucas Anderson", email: "lucas@acme.com", role: "Viewer", status: "Pending", department: "Marketing", joinDate: "2024-02-01", lastActive: "2 days ago" },
]

const orders = [
  { id: "ORD-001", customer: "John Doe", email: "john@email.com", product: "Pro Plan", amount: "$99.00", status: "Completed", date: "2024-03-15" },
  { id: "ORD-002", customer: "Jane Smith", email: "jane@email.com", product: "Enterprise", amount: "$299.00", status: "Processing", date: "2024-03-14" },
  { id: "ORD-003", customer: "Bob Wilson", email: "bob@email.com", product: "Starter", amount: "$29.00", status: "Completed", date: "2024-03-14" },
  { id: "ORD-004", customer: "Alice Brown", email: "alice@email.com", product: "Pro Plan", amount: "$99.00", status: "Failed", date: "2024-03-13" },
  { id: "ORD-005", customer: "Charlie Davis", email: "charlie@email.com", product: "Enterprise", amount: "$299.00", status: "Refunded", date: "2024-03-12" },
]

export function DataTablesSection() {
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  // Filter and sort logic
  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortColumn) return 0
    const aValue = a[sortColumn as keyof typeof a]
    const bValue = b[sortColumn as keyof typeof b]
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedUsers.length / rowsPerPage)
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  const toggleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const toggleSelectAll = () => {
    if (selectedRows.length === paginatedUsers.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(paginatedUsers.map((u) => u.id))
    }
  }

  const toggleSelectRow = (id: number) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-2 size-4 text-muted-foreground" />
    return sortDirection === "asc" 
      ? <ArrowUp className="ml-2 size-4" /> 
      : <ArrowDown className="ml-2 size-4" />
  }

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Data Tables</h1>
        <p className="max-w-2xl text-muted-foreground">
          Advanced data tables with search, filtering, sorting, pagination, 
          row selection, and bulk actions. Ideal for admin dashboards and data management.
        </p>
      </div>

      {/* Full Featured DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>Full Featured DataTable</CardTitle>
          <CardDescription>
            Complete data table with search, filters, sorting, pagination, and bulk actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 size-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              {(searchQuery || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("all")
                    setCurrentPage(1)
                  }}
                >
                  <X className="mr-2 size-4" />
                  Reset
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedRows.length > 0 && (
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 size-4" />
                  Delete ({selectedRows.length})
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Columns3 className="mr-2 size-4" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked>Name</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked>Email</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked>Role</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked>Status</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked>Department</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>Join Date</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>Last Active</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm">
                <Download className="mr-2 size-4" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="mr-2 size-4" />
                Add User
              </Button>
            </div>
          </div>

          {/* Selected rows indicator */}
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
              <span className="font-medium">{selectedRows.length} row(s) selected</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedRows([])}>
                Clear selection
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRows.length === paginatedUsers.length && paginatedUsers.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="-ml-3 h-8 hover:bg-transparent"
                      onClick={() => toggleSort("name")}
                    >
                      Name
                      <SortIcon column="name" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="-ml-3 h-8 hover:bg-transparent"
                      onClick={() => toggleSort("email")}
                    >
                      Email
                      <SortIcon column="email" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="-ml-3 h-8 hover:bg-transparent"
                      onClick={() => toggleSort("role")}
                    >
                      Role
                      <SortIcon column="role" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="-ml-3 h-8 hover:bg-transparent"
                      onClick={() => toggleSort("status")}
                    >
                      Status
                      <SortIcon column="status" />
                    </Button>
                  </TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-muted-foreground">No results found</p>
                        <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setStatusFilter("all") }}>
                          Clear filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id} data-state={selectedRows.includes(user.id) && "selected"}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(user.id)}
                          onCheckedChange={() => toggleSelectRow(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                            <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.status === "Active"
                              ? "bg-success text-success-foreground"
                              : user.status === "Inactive"
                              ? "bg-muted text-muted-foreground"
                              : "bg-warning text-warning-foreground"
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.department}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 size-4" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 size-4" />
                              Edit user
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 size-4" />
                              Delete user
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page:</span>
              <Select value={rowsPerPage.toString()} onValueChange={(v) => { setRowsPerPage(Number(v)); setCurrentPage(1) }}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="ml-4">
                Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, sortedUsers.length)} of {sortedUsers.length} results
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "ghost"}
                      size="icon-sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Minimal DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>Minimal DataTable</CardTitle>
          <CardDescription>
            Clean and simple data table with inline search
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search orders..." className="pl-9" />
            </div>
            <Button variant="outline" size="sm">
              <FileDown className="mr-2 size-4" />
              Export CSV
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer}</div>
                        <div className="text-sm text-muted-foreground">{order.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{order.product}</TableCell>
                    <TableCell className="font-medium">{order.amount}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === "Completed" ? "default" :
                          order.status === "Processing" ? "secondary" :
                          order.status === "Refunded" ? "outline" :
                          "destructive"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{order.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing 5 of 5 orders</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expandable Rows */}
      <Card>
        <CardHeader>
          <CardTitle>Expandable Rows</CardTitle>
          <CardDescription>
            Table with expandable rows for additional details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpandableTable />
        </CardContent>
      </Card>

      {/* Inline Editing */}
      <Card>
        <CardHeader>
          <CardTitle>Inline Editing</CardTitle>
          <CardDescription>
            Click on a cell to edit its value directly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InlineEditTable />
        </CardContent>
      </Card>

      {/* Loading State */}
      <Card>
        <CardHeader>
          <CardTitle>Loading State</CardTitle>
          <CardDescription>
            Skeleton loading state for data tables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-64 animate-pulse rounded-md bg-muted" />
            <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"><div className="h-4 w-4 animate-pulse rounded bg-muted" /></TableHead>
                  <TableHead><div className="h-4 w-20 animate-pulse rounded bg-muted" /></TableHead>
                  <TableHead><div className="h-4 w-32 animate-pulse rounded bg-muted" /></TableHead>
                  <TableHead><div className="h-4 w-16 animate-pulse rounded bg-muted" /></TableHead>
                  <TableHead><div className="h-4 w-16 animate-pulse rounded bg-muted" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-4 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-8 animate-pulse rounded-full bg-muted" />
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      </div>
                    </TableCell>
                    <TableCell><div className="h-4 w-40 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-16 animate-pulse rounded-full bg-muted" /></TableCell>
                    <TableCell><div className="h-5 w-14 animate-pulse rounded-full bg-muted" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Sticky Header */}
      <Card>
        <CardHeader>
          <CardTitle>Sticky Header</CardTitle>
          <CardDescription>
            Table with fixed header for scrollable content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[300px] overflow-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell className="text-muted-foreground">{user.lastActive}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Expandable Table Component
function ExpandableTable() {
  const [expandedRows, setExpandedRows] = useState<string[]>([])

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  const data = [
    { 
      id: "ORD-001", 
      customer: "Acme Corp", 
      total: "$1,250.00", 
      status: "Completed",
      items: [
        { name: "Pro Plan (Annual)", qty: 1, price: "$990.00" },
        { name: "Additional Users (5)", qty: 5, price: "$260.00" }
      ]
    },
    { 
      id: "ORD-002", 
      customer: "Globex Inc", 
      total: "$2,500.00", 
      status: "Processing",
      items: [
        { name: "Enterprise Plan", qty: 1, price: "$2,500.00" }
      ]
    },
    { 
      id: "ORD-003", 
      customer: "Initech", 
      total: "$890.00", 
      status: "Pending",
      items: [
        { name: "Pro Plan (Monthly)", qty: 1, price: "$99.00" },
        { name: "API Access", qty: 1, price: "$791.00" }
      ]
    },
  ]

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((order) => (
            <>
              <TableRow key={order.id}>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <ChevronRight className={`size-4 transition-transform ${expandedRows.includes(order.id) ? "rotate-90" : ""}`} />
                  </Button>
                </TableCell>
                <TableCell className="font-mono">{order.id}</TableCell>
                <TableCell className="font-medium">{order.customer}</TableCell>
                <TableCell>{order.total}</TableCell>
                <TableCell>
                  <Badge variant={order.status === "Completed" ? "default" : "secondary"}>
                    {order.status}
                  </Badge>
                </TableCell>
              </TableRow>
              {expandedRows.includes(order.id) && (
                <TableRow>
                  <TableCell colSpan={5} className="bg-muted/50 p-0">
                    <div className="p-4">
                      <h4 className="mb-3 text-sm font-medium">Order Items</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-center">Qty</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item, i) => (
                            <TableRow key={i}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell className="text-center">{item.qty}</TableCell>
                              <TableCell className="text-right">{item.price}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Inline Edit Table Component
function InlineEditTable() {
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null)
  const [data, setData] = useState([
    { id: 1, name: "Product A", price: "29.99", stock: "150" },
    { id: 2, name: "Product B", price: "49.99", stock: "75" },
    { id: 3, name: "Product C", price: "99.99", stock: "30" },
  ])

  const handleEdit = (rowId: number, col: string, value: string) => {
    setData((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, [col]: value } : row
      )
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Price ($)</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                {editingCell?.row === row.id && editingCell?.col === "name" ? (
                  <Input
                    defaultValue={row.name}
                    className="h-8"
                    autoFocus
                    onBlur={(e) => {
                      handleEdit(row.id, "name", e.target.value)
                      setEditingCell(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleEdit(row.id, "name", e.currentTarget.value)
                        setEditingCell(null)
                      }
                      if (e.key === "Escape") setEditingCell(null)
                    }}
                  />
                ) : (
                  <span
                    className="cursor-pointer rounded px-2 py-1 hover:bg-muted"
                    onClick={() => setEditingCell({ row: row.id, col: "name" })}
                  >
                    {row.name}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {editingCell?.row === row.id && editingCell?.col === "price" ? (
                  <Input
                    defaultValue={row.price}
                    className="h-8 w-24"
                    autoFocus
                    onBlur={(e) => {
                      handleEdit(row.id, "price", e.target.value)
                      setEditingCell(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleEdit(row.id, "price", e.currentTarget.value)
                        setEditingCell(null)
                      }
                      if (e.key === "Escape") setEditingCell(null)
                    }}
                  />
                ) : (
                  <span
                    className="cursor-pointer rounded px-2 py-1 hover:bg-muted"
                    onClick={() => setEditingCell({ row: row.id, col: "price" })}
                  >
                    ${row.price}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {editingCell?.row === row.id && editingCell?.col === "stock" ? (
                  <Input
                    defaultValue={row.stock}
                    className="h-8 w-20"
                    autoFocus
                    onBlur={(e) => {
                      handleEdit(row.id, "stock", e.target.value)
                      setEditingCell(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleEdit(row.id, "stock", e.currentTarget.value)
                        setEditingCell(null)
                      }
                      if (e.key === "Escape") setEditingCell(null)
                    }}
                  />
                ) : (
                  <span
                    className="cursor-pointer rounded px-2 py-1 hover:bg-muted"
                    onClick={() => setEditingCell({ row: row.id, col: "stock" })}
                  >
                    {row.stock}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon-sm">
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
