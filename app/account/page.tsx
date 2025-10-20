"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/firebase/auth-context"
import { ProtectedRoute } from "@/lib/firebase/protected-route"
import {
  User,
  Package,
  MapPin,
  CreditCard,
  Heart,
  Bell,
  Shield,
  Edit,
  Trash2,
  Plus,
  Eye,
  Download,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { db, auth } from "@/lib/firebase/config"
import { collection, query, where, getDocs, orderBy, limit, addDoc, deleteDoc, doc, updateDoc, setDoc } from "firebase/firestore"
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth"
import { useCart } from "@/lib/cart-context"
import { ProductCard } from "@/components/product-card"
import type { Product } from "@/lib/types"
import { toast } from "sonner"

// Mock data - replace with real data from Firebase
const mockOrders = [
  {
    id: "ORD-001",
    date: "2025-09-28",
    status: "delivered",
    total: 199.99,
    items: [
      {
        id: "1",
        name: "Wireless Headphones",
        image: "/placeholder.svg",
        quantity: 1,
        price: 199.99,
      },
    ],
    trackingNumber: "TRK123456789",
  },
  {
    id: "ORD-002",
    date: "2025-09-25",
    status: "shipped",
    total: 89.99,
    items: [
      {
        id: "2",
        name: "Smart Watch",
        image: "/placeholder.svg",
        quantity: 1,
        price: 89.99,
      },
    ],
    trackingNumber: "TRK987654321",
  },
  {
    id: "ORD-003",
    date: "2025-09-20",
    status: "processing",
    total: 149.99,
    items: [
      {
        id: "3",
        name: "Bluetooth Speaker",
        image: "/placeholder.svg",
        quantity: 1,
        price: 149.99,
      },
    ],
    trackingNumber: null,
  },
]

const mockAddresses = [
  {
    id: "1",
    type: "Home",
    fullName: "John Doe",
    addressLine1: "123 Main Street",
    addressLine2: "Apt 4B",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "United States",
    phone: "+1 (555) 123-4567",
    isDefault: true,
  },
  {
    id: "2",
    type: "Work",
    fullName: "John Doe",
    addressLine1: "456 Business Ave",
    addressLine2: "Suite 200",
    city: "New York",
    state: "NY",
    zipCode: "10002",
    country: "United States",
    phone: "+1 (555) 987-6543",
    isDefault: false,
  },
]

function AccountPageContent() {
  const { user, userProfile } = useAuth()
  const { addToCart } = useCart()
  const [activeTab, setActiveTab] = useState("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [wishlist, setWishlist] = useState<Product[]>([])
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: '',
    phone: '',
    birthday: ''
  })
  const [saving, setSaving] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any>(null)
  const [addressForm, setAddressForm] = useState({
    type: 'Home',
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nigeria',
    phone: '',
    isDefault: false
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Load orders from Firestore
  useEffect(() => {
    async function loadOrders() {
      if (!user) return
      
      try {
        setLoading(true)
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        )
        const snapshot = await getDocs(ordersQuery)
        
        // Fetch product details for each order
        const ordersData = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const orderData = docSnap.data()
            
            // Enrich items with product images
            const enrichedItems = await Promise.all(
              (orderData.items || []).map(async (item: any) => {
                try {
                  // Fetch product details
                  const productDoc = await getDocs(
                    query(collection(db, 'products'), where('__name__', '==', item.productId))
                  )
                  
                  if (!productDoc.empty) {
                    const productData = productDoc.docs[0].data()
                    return {
                      ...item,
                      image: productData.images?.[0] || null,
                      productType: productData.productType || 'physical'
                    }
                  }
                } catch (error) {
                  console.error('Error fetching product:', error)
                }
                return item
              })
            )
            
            return {
              id: docSnap.id,
              ...orderData,
              items: enrichedItems,
              createdAt: orderData.createdAt || new Date()
            }
          })
        )
        
        setOrders(ordersData)
      } catch (error) {
        console.error('Error loading orders:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadOrders()
  }, [user])

  // Load profile data
  useEffect(() => {
    if (userProfile) {
      setProfileData({
        displayName: userProfile.displayName || '',
        phone: userProfile.phone || '',
        birthday: userProfile.birthday || ''
      })
    }
  }, [userProfile])

  // Load addresses from Firestore
  useEffect(() => {
    async function loadAddresses() {
      if (!user) return
      
      try {
        const addressesQuery = query(
          collection(db, 'addresses'),
          where('userId', '==', user.uid)
        )
        const snapshot = await getDocs(addressesQuery)
        const addressesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setAddresses(addressesData)
      } catch (error) {
        console.error('Error loading addresses:', error)
      }
    }
    
    loadAddresses()
  }, [user])

  // Load wishlist from Firestore
  useEffect(() => {
    async function loadWishlist() {
      if (!user) return
      
      try {
        const wishlistQuery = query(
          collection(db, 'wishlists'),
          where('userId', '==', user.uid)
        )
        const snapshot = await getDocs(wishlistQuery)
        const productIds = snapshot.docs.map(doc => doc.data().productId)
        
        if (productIds.length > 0) {
          const productsQuery = query(
            collection(db, 'products'),
            where('__name__', 'in', productIds.slice(0, 10))
          )
          const productsSnapshot = await getDocs(productsQuery)
          const productsData = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Product[]
          setWishlist(productsData)
        }
      } catch (error) {
        console.error('Error loading wishlist:', error)
      }
    }
    
    loadWishlist()
  }, [user])

  const removeFromWishlist = async (productId: string) => {
    if (!user) return
    
    try {
      const wishlistQuery = query(
        collection(db, 'wishlists'),
        where('userId', '==', user.uid),
        where('productId', '==', productId)
      )
      const snapshot = await getDocs(wishlistQuery)
      
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, 'wishlists', docSnap.id))
      }
      
      setWishlist(wishlist.filter(p => p.id !== productId))
      toast.success('Removed from wishlist')
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      toast.error('Failed to remove from wishlist')
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    
    try {
      setSaving(true)
      
      // Update user profile in Firestore
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        displayName: profileData.displayName,
        phone: profileData.phone,
        birthday: profileData.birthday,
        updatedAt: new Date()
      })
      
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAddAddress = () => {
    setEditingAddress(null)
    setAddressForm({
      type: 'Home',
      fullName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Nigeria',
      phone: '',
      isDefault: false
    })
    setShowAddressForm(true)
  }

  const handleEditAddress = (address: any) => {
    setEditingAddress(address)
    setAddressForm({
      type: address.type || 'Home',
      fullName: address.fullName || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || '',
      country: address.country || 'Nigeria',
      phone: address.phone || '',
      isDefault: address.isDefault || false
    })
    setShowAddressForm(true)
  }

  const handleSaveAddress = async () => {
    if (!user) return
    
    try {
      setSaving(true)
      
      if (editingAddress) {
        // Update existing address
        const addressRef = doc(db, 'addresses', editingAddress.id)
        await updateDoc(addressRef, {
          ...addressForm,
          updatedAt: new Date()
        })
        
        setAddresses(addresses.map(addr => 
          addr.id === editingAddress.id ? { ...addr, ...addressForm } : addr
        ))
        toast.success('Address updated successfully!')
      } else {
        // Add new address
        const newAddress = {
          ...addressForm,
          userId: user.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        const docRef = await addDoc(collection(db, 'addresses'), newAddress)
        setAddresses([...addresses, { id: docRef.id, ...newAddress }])
        toast.success('Address added successfully!')
      }
      
      setShowAddressForm(false)
      setEditingAddress(null)
    } catch (error) {
      console.error('Error saving address:', error)
      toast.error('Failed to save address')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!user || !confirm('Are you sure you want to delete this address?')) return
    
    try {
      await deleteDoc(doc(db, 'addresses', addressId))
      setAddresses(addresses.filter(addr => addr.id !== addressId))
      toast.success('Address deleted successfully!')
    } catch (error) {
      console.error('Error deleting address:', error)
      toast.error('Failed to delete address')
    }
  }

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!user) return
    
    try {
      // Update all addresses to not default
      const batch = addresses.map(async (addr) => {
        const addressRef = doc(db, 'addresses', addr.id)
        await updateDoc(addressRef, {
          isDefault: addr.id === addressId
        })
      })
      
      await Promise.all(batch)
      
      setAddresses(addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      })))
      
      toast.success('Default address updated!')
    } catch (error) {
      console.error('Error setting default address:', error)
      toast.error('Failed to set default address')
    }
  }

  const handleChangePassword = async () => {
    if (!user) return
    
    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    try {
      setChangingPassword(true)
      
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        user.email!,
        passwordForm.currentPassword
      )
      await reauthenticateWithCredential(user, credential)
      
      // Update password
      await updatePassword(user, passwordForm.newPassword)
      
      // Clear form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      toast.success('Password updated successfully!')
    } catch (error: any) {
      console.error('Error changing password:', error)
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect')
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log back in before changing your password')
      } else {
        toast.error('Failed to update password')
      }
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    
    try {
      setSaving(true)
      
      // Delete user data from Firestore
      const collections = ['orders', 'addresses', 'wishlists']
      for (const collectionName of collections) {
        const q = query(collection(db, collectionName), where('userId', '==', user.uid))
        const snapshot = await getDocs(q)
        for (const docSnap of snapshot.docs) {
          await deleteDoc(doc(db, collectionName, docSnap.id))
        }
      }
      
      // Delete user profile
      await deleteDoc(doc(db, 'users', user.uid))
      
      // Delete Firebase Auth account
      await deleteUser(user)
      
      toast.success('Account deleted successfully')
      // User will be automatically logged out
    } catch (error: any) {
      console.error('Error deleting account:', error)
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log back in before deleting your account')
      } else {
        toast.error('Failed to delete account. Please try again.')
      }
    } finally {
      setSaving(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!user || !confirm('Are you sure you want to cancel this order?')) return
    
    try {
      setSaving(true)
      const orderRef = doc(db, 'orders', orderId)
      await updateDoc(orderRef, {
        status: 'cancelled',
        updatedAt: new Date()
      })
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: 'cancelled' } : order
      ))
      
      toast.success('Order cancelled successfully')
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error('Failed to cancel order')
    } finally {
      setSaving(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "shipped":
        return <Truck className="h-5 w-5 text-blue-600" />
      case "processing":
        return <Clock className="h-5 w-5 text-orange-600" />
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Package className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-orange-100 text-orange-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">My Account</h1>
            <p className="text-muted-foreground">Manage your account settings and view your orders</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar */}
            <aside className="space-y-2">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={userProfile?.photoURL} />
                      <AvatarFallback className="text-2xl">
                        {userProfile?.displayName?.charAt(0) || user?.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg">{userProfile?.displayName || "User"}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge variant="secondary" className="mt-2">
                      {userProfile?.role}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Button
                variant={activeTab === "profile" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("profile")}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
              <Button
                variant={activeTab === "orders" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("orders")}
              >
                <Package className="mr-2 h-4 w-4" />
                Orders
              </Button>
              <Link href="/my-purchases">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Download className="mr-2 h-4 w-4" />
                  My Purchases
                </Button>
              </Link>
              <Button
                variant={activeTab === "addresses" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("addresses")}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Addresses
              </Button>
              <Button
                variant={activeTab === "wishlist" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("wishlist")}
              >
                <Heart className="mr-2 h-4 w-4" />
                Wishlist
              </Button>
              <Button
                variant={activeTab === "notifications" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("notifications")}
              >
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Button>
              <Button
                variant={activeTab === "security" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("security")}
              >
                <Shield className="mr-2 h-4 w-4" />
                Security
              </Button>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your personal details</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={profileData.displayName}
                          onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ""}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+234 (800) 123-4567"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthday">Date of Birth</Label>
                        <Input
                          id="birthday"
                          type="date"
                          value={profileData.birthday}
                          onChange={(e) => setProfileData({...profileData, birthday: e.target.value})}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsEditing(false)
                            // Reset to original values
                            setProfileData({
                              displayName: userProfile?.displayName || '',
                              phone: userProfile?.phone || '',
                              birthday: userProfile?.birthday || ''
                            })
                          }}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={saving}>
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Orders Tab */}
              {activeTab === "orders" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order History</CardTitle>
                      <CardDescription>View and track your orders</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {loading ? (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">Loading orders...</p>
                        </div>
                      ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                          <p className="text-muted-foreground mb-4">
                            Start shopping to see your orders here
                          </p>
                          <Button asChild>
                            <Link href="/products">Browse Products</Link>
                          </Button>
                        </div>
                      ) : (
                        orders.map((order) => (
                        <Card key={order.id}>
                          <CardContent className="p-6">
                            <div className="flex flex-col gap-4">
                              {/* Order Header */}
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{order.id}</h3>
                                    <Badge className={getStatusColor(order.status)}>
                                      {order.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Placed on {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-NG', { 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    }) : 'Invalid Date'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">₦{(order.total || 0).toLocaleString()}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {order.items?.length || 0} item(s)
                                  </p>
                                </div>
                              </div>

                              <Separator />

                              {/* Order Items */}
                              <div className="space-y-3">
                                {order.items && order.items.length > 0 ? (
                                  order.items.map((item: any, index: number) => (
                                    <div key={item.productId || index} className="flex items-center gap-4">
                                      <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted">
                                        {item.image ? (
                                          <Image
                                            src={item.image}
                                            alt={item.productName || item.name || 'Product'}
                                            fill
                                            className="object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-muted">
                                            <Package className="h-8 w-8 text-muted-foreground" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium">{item.productName || item.name || 'Product'}</p>
                                        <p className="text-sm text-muted-foreground">
                                          Qty: {item.quantity || 1}
                                        </p>
                                      </div>
                                      <p className="font-medium">
                                        ₦{(item.productPrice || item.price || 0).toLocaleString()}
                                      </p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground">No items</p>
                                )}
                              </div>

                              {/* Order Actions */}
                              <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" disabled>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Button>
                                {order.trackingNumber && (
                                  <Button variant="outline" size="sm" disabled>
                                    <Truck className="mr-2 h-4 w-4" />
                                    Track Order
                                  </Button>
                                )}
                                <Button variant="outline" size="sm" disabled>
                                  <Download className="mr-2 h-4 w-4" />
                                  Invoice
                                </Button>
                                {(order.status === 'pending' || order.status === 'processing') && (
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => handleCancelOrder(order.id)}
                                    disabled={saving}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel Order
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Addresses Tab */}
              {activeTab === "addresses" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Saved Addresses</CardTitle>
                        <CardDescription>Manage your delivery addresses ({addresses.length})</CardDescription>
                      </div>
                      <Button onClick={handleAddAddress}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Address
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {showAddressForm && (
                        <Card className="border-2 border-primary">
                          <CardHeader>
                            <CardTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="addressType">Address Type</Label>
                                <Input
                                  id="addressType"
                                  placeholder="Home, Office, etc."
                                  value={addressForm.type}
                                  onChange={(e) => setAddressForm({...addressForm, type: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="addressFullName">Full Name</Label>
                                <Input
                                  id="addressFullName"
                                  value={addressForm.fullName}
                                  onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="addressLine1">Address Line 1</Label>
                              <Input
                                id="addressLine1"
                                value={addressForm.addressLine1}
                                onChange={(e) => setAddressForm({...addressForm, addressLine1: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                              <Input
                                id="addressLine2"
                                value={addressForm.addressLine2}
                                onChange={(e) => setAddressForm({...addressForm, addressLine2: e.target.value})}
                              />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                              <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                  id="city"
                                  value={addressForm.city}
                                  onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                  id="state"
                                  value={addressForm.state}
                                  onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="zipCode">ZIP Code</Label>
                                <Input
                                  id="zipCode"
                                  value={addressForm.zipCode}
                                  onChange={(e) => setAddressForm({...addressForm, zipCode: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="addressPhone">Phone Number</Label>
                                <Input
                                  id="addressPhone"
                                  type="tel"
                                  value={addressForm.phone}
                                  onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                  id="country"
                                  value={addressForm.country}
                                  onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="isDefault"
                                checked={addressForm.isDefault}
                                onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                                className="h-4 w-4"
                              />
                              <Label htmlFor="isDefault" className="cursor-pointer">Set as default address</Label>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setShowAddressForm(false)
                                  setEditingAddress(null)
                                }}
                                disabled={saving}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleSaveAddress} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Address'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {addresses.length === 0 && !showAddressForm ? (
                        <div className="text-center py-12">
                          <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No addresses saved</h3>
                          <p className="text-muted-foreground mb-4">
                            Add your first delivery address
                          </p>
                          <Button onClick={handleAddAddress}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Address
                          </Button>
                        </div>
                      ) : (
                        addresses.map((address) => (
                        <Card key={address.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{address.type}</h3>
                                  {address.isDefault && (
                                    <Badge variant="secondary">Default</Badge>
                                  )}
                                </div>
                                <p className="text-sm">{address.fullName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {address.addressLine1}
                                  {address.addressLine2 && `, ${address.addressLine2}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {address.city}, {address.state} {address.zipCode}
                                </p>
                                <p className="text-sm text-muted-foreground">{address.country}</p>
                                <p className="text-sm text-muted-foreground mt-1">{address.phone}</p>
                              </div>
                              <div className="flex gap-2">
                                {!address.isDefault && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleSetDefaultAddress(address.id)}
                                  >
                                    Set Default
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditAddress(address)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteAddress(address.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}


              {/* Wishlist Tab */}
              {activeTab === "wishlist" && (
                <Card>
                  <CardHeader>
                    <CardTitle>My Wishlist</CardTitle>
                    <CardDescription>Items you've saved for later ({wishlist.length})</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {wishlist.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
                        <p className="text-muted-foreground mb-4">
                          Start adding items you love to your wishlist
                        </p>
                        <Button asChild>
                          <Link href="/products">Browse Products</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {wishlist.map((product) => (
                          <div key={product.id} className="relative">
                            <ProductCard product={product} onAddToCart={addToCart} />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                              onClick={() => removeFromWishlist(product.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Manage how you receive updates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Order Updates</p>
                          <p className="text-sm text-muted-foreground">
                            Get notified about your order status
                          </p>
                        </div>
                        <input type="checkbox" defaultChecked className="h-4 w-4" />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Promotional Emails</p>
                          <p className="text-sm text-muted-foreground">
                            Receive deals and special offers
                          </p>
                        </div>
                        <input type="checkbox" defaultChecked className="h-4 w-4" />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Product Recommendations</p>
                          <p className="text-sm text-muted-foreground">
                            Get personalized product suggestions
                          </p>
                        </div>
                        <input type="checkbox" className="h-4 w-4" />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Price Drop Alerts</p>
                          <p className="text-sm text-muted-foreground">
                            Get notified when wishlist items go on sale
                          </p>
                        </div>
                        <input type="checkbox" defaultChecked className="h-4 w-4" />
                      </div>
                    </div>
                    <Button>Save Preferences</Button>
                  </CardContent>
                </Card>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Password</CardTitle>
                      <CardDescription>Change your password</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input 
                          id="currentPassword" 
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input 
                          id="newPassword" 
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        />
                        <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input 
                          id="confirmPassword" 
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        />
                      </div>
                      <Button onClick={handleChangePassword} disabled={changingPassword}>
                        {changingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-destructive">
                    <CardHeader>
                      <CardTitle className="text-destructive">Delete Account</CardTitle>
                      <CardDescription>Permanently delete your account and all data</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!showDeleteConfirm ? (
                        <>
                          <p className="text-sm text-muted-foreground mb-4">
                            Once you delete your account, there is no going back. All your orders, addresses, and wishlist will be permanently deleted.
                          </p>
                          <Button 
                            variant="destructive" 
                            onClick={() => setShowDeleteConfirm(true)}
                          >
                            Delete Account
                          </Button>
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div className="rounded-lg bg-destructive/10 p-4 border border-destructive">
                            <p className="text-sm font-medium text-destructive mb-2">⚠️ Warning: This action cannot be undone!</p>
                            <p className="text-sm text-muted-foreground">
                              Are you absolutely sure you want to delete your account? This will:
                            </p>
                            <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                              <li>Delete all your orders and purchase history</li>
                              <li>Remove all saved addresses</li>
                              <li>Clear your wishlist</li>
                              <li>Permanently delete your account</li>
                            </ul>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setShowDeleteConfirm(false)}
                              disabled={saving}
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={handleDeleteAccount}
                              disabled={saving}
                            >
                              {saving ? 'Deleting...' : 'Yes, Delete My Account'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function AccountPage() {
  return (
    <ProtectedRoute allowedRoles={["customer", "vendor", "admin"]}>
      <AccountPageContent />
    </ProtectedRoute>
  )
}
