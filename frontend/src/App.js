import {Routes, Route} from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import {AuthProvider} from "./context/AuthContext";

import { HomePage } from "./pages/HomePage"
import {Notfoundpage} from "./pages/NotFoundPage";
import {ProfilePage} from "./pages/ProfilePage";
import {CartPage} from "./pages/CartPage";
import {Loginpage} from "./pages/LoginPage";
import {OrdersPage} from "./pages/OrdersPage";
import {RegisterForm} from "./pages/RegistrationPage";
import {WishListPage} from "./pages/WishListPage";
import CatalogPage from "./pages/CatalogPage";
import {CartProvider} from "./hooks/useCart";
import {ProductPage} from "./pages/ProductPage";
import {BrandPage} from "./pages/BrandPage";
import {CheckoutPage} from "./pages/CheckoutPage";
import {OrderDetailsPage} from "./pages/OrderDetailsPage";
import {EditProfilePage} from "./pages/EditProfilePage";
import {AllProductsPage} from "./pages/AllProductsPage";



export default function App() {
  return (
      <div>
          <div className='wrapper'>
              <CartProvider>
                  <AuthProvider>
                  <Header/>
              <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<Loginpage />} />
                  <Route path="/register" element={<RegisterForm />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/cart" element={< CartPage/>} />
                  <Route path="/wishlist" element={<WishListPage />} />
                  <Route path="/account" element={<ProfilePage />} />
                  <Route path="/category/:categorySlug" element={<CatalogPage />} />
                  <Route path="/products" element={<AllProductsPage />} />
                  <Route path="/product/:id" element={<ProductPage />} />
                  <Route path="/brand/:brandSlug" element={<BrandPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
                  <Route path="/profile/edit" element={<EditProfilePage />} />
                  <Route path="*" element={<Notfoundpage />} />
              </Routes>
              </AuthProvider>
              </CartProvider>




          </div>
              <Footer/>
      </div>

  );
}


