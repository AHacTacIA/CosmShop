import {Routes, Route} from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import {AuthProvider} from "./context/AuthContext";

import { Homepage } from "./pages/HomePage"
import {Notfoundpage} from "./pages/NotFoundPage";
import {ProfilePage} from "./pages/ProfilePage";
import {CartPage} from "./pages/CartPage";
import {Loginpage} from "./pages/LoginPage";
import {Orderspage} from "./pages/OrdersPage";
import {RegisterForm} from "./pages/RegistrationPage";
import {WishListPage} from "./pages/WishListPage";
import CatalogPage from "./pages/CatalogPage";
import {CartProvider} from "./hooks/useCart";
import {ProductPage} from "./pages/ProductPage";



export default function App() {
  return (
      <div>
          <div className='wrapper'>
              <CartProvider>
                  <AuthProvider>
                  <Header/>
              <Routes>
                  <Route path="/" element={<Homepage />} />
                  <Route path="/login" element={<Loginpage />} />
                  <Route path="/register" element={<RegisterForm />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/cart" element={< CartPage/>} />
                  <Route path="/orders" element={<Orderspage />} />
                  <Route path="/wishlist" element={<WishListPage />} />
                  <Route path="/account" element={<ProfilePage />} />
                  <Route path="/category/:categorySlug" element={<CatalogPage />} />
                  <Route path="/product/:id" element={<ProductPage />} />
                  <Route path="*" element={<Notfoundpage />} />
              </Routes>
              </AuthProvider>
              </CartProvider>




          </div>
              <Footer/>
      </div>

  );
}


