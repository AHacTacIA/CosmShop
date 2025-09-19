import {Routes, Route, Link} from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";

import { Homepage } from "./pages/HomePage"
import {Notfoundpage} from "./pages/NotFoundPage";
import {ProfilePage} from "./pages/ProfilePage";
import {Cartpage} from "./pages/CartPage";
import {Loginpage} from "./pages/LoginPage";
import {Orderspage} from "./pages/OrdersPage";
import {RegisterForm} from "./pages/RegistrationPage";
import {WishListpage} from "./pages/WishListPage";



export default function App() {
  return (
      <div>
          <div className='wrapper'>
              <Header/>
              <Routes>
                  <Route path="/" element={<Homepage />} />
                  <Route path="/login" element={<Loginpage />} />
                  <Route path="/register" element={<RegisterForm />} />
        <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/cart" element={< Cartpage/>} />
                  <Route path="/orders" element={<Orderspage />} />
                  <Route path="/wishlist" element={<WishListpage />} />
                  <Route path="/account" element={<ProfilePage />} />
                  <Route path="*" element={<Notfoundpage />} />
              </Routes>


          </div>
              <Footer/>
      </div>

  );
}


