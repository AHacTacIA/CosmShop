import React from "react";
import NavBar from "./NavBar";
import {Link} from "react-router-dom";
import '../index.css';
import searchIcon from '../img/search.svg'
import heartIcon from '../img/heart.svg'
import personIcon from '../img/person.svg'
import handbagIcon from '../img/handbag.svg'

export default function Header(){
    return(
        <header>
            <div className="header-top">
                <Link to="/" className="shop-link">
                    <span className='shop_name'>Gloss</span>
                </Link>

                <ul className='header_tabs'>
                    <li className="icon-item">
                        <img
                            src={searchIcon}
                            alt="Search"
                            width="25"
                            height="25"
                            className="header-icon"
                        />


                    </li>
                    <li className="icon-item">
                        <Link to="/wishlist" className="icon-link">
                            <img
                                src={heartIcon}
                                alt="Search"
                                width="25"
                                height="25"
                                className="header-icon"
                            />
                        </Link>

                    </li>
                    <li className="icon-item">
                        <Link to="/register" className="icon-link">
                            <img
                                src={personIcon}
                                alt="Search"
                                width="25"
                                height="25"
                                className="header-icon"
                            />
                        </Link>

                    </li>
                    <li className="icon-item">
                        <Link to="/cart" className="icon-link">
                            <img
                                src={handbagIcon}
                                alt="Search"
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