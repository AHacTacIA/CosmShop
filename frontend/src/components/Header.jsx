// Header.jsx
import React from "react";
import NavBar from "./NavBar";
import {Link} from "react-router-dom";
import '../index.css';
import searchIcon from '../img/search.svg'
import heartIcon from '../img/heart.svg'
import personIcon from '../img/person.svg'
import handbagIcon from '../img/handbag.svg'
// import apiClient from "../api/client";
import {useAuth} from "../context/AuthContext";
// import {useAuth} from "../context/AuthContext";

export default function Header(){
    // const { isAuthenticated, currentUser, logout } = useAuth();
    // const isAuthenticated = apiClient.auth.isAuthenticated()
    const { isAuthenticated } = useAuth();
    console.log("isAuthenticated",isAuthenticated)

    return(
        <header>
            <div className="header-top">
                <Link to="/" className="shop-link">
                    <span className='shop_name'>Gloss</span>
                </Link>

                <ul className='header_tabs'>
                    {/*<li className="icon-item">*/}
                    {/*    <img*/}
                    {/*        src={searchIcon}*/}
                    {/*        alt="Search"*/}
                    {/*        width="25"*/}
                    {/*        height="25"*/}
                    {/*        className="header-icon"*/}
                    {/*    />*/}


                    {/*</li>*/}

                    <li className="icon-item">
                        <Link to="/wishlist" className="icon-link">
                            <img
                                src={heartIcon}
                                alt="Wish list"
                                width="25"
                                height="25"
                                className="header-icon"
                            />
                        </Link>

                    </li>

                    <li className="icon-item">
                        <Link
                            to={isAuthenticated ? "/profile" : "/login"}
                            className="icon-link"
                            title={isAuthenticated ? "Профиль" : "Войти"}
                        >
                            <img
                                src={personIcon}
                                alt={isAuthenticated ? "Профиль" : "Войти"}
                                width="25"
                                height="25"
                                className="header-icon"
                            />
                            {isAuthenticated && (
                                <span className="auth-indicator"></span>
                            )}
                        </Link>
                    </li>

                    <li className="icon-item">
                        <Link to="/cart" className="icon-link">
                            <img
                                src={handbagIcon}
                                alt="Cart"
                                width="25"
                                height="25"
                                className="header-icon"
                            />
                        </Link>

                    </li>

                </ul>
            </div>

            <NavBar/>


            <div className='banner'></div>
        </header>

    )
}