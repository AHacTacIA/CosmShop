import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Header(){
    return(
            <header>
                <div>
                    <span className='shop_name'>Gloss</span>
                    <ul className='header_tabs'>
                        <li>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor"
                                 className="bi bi-search" viewBox="0 0 16 16">
                                <path
                                    d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                            </svg>
                        </li>
                        <li>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor"
                                 className="bi bi-heart" viewBox="0 0 16 16">
                                <path
                                    d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15"/>
                            </svg>
                        </li>
                        <li>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor"
                                 className="bi bi-person" viewBox="0 0 16 16">
                                <path
                                    d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
                            </svg>
                        </li>
                        <li>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor"
                                 className="bi bi-handbag" viewBox="0 0 16 16">
                                <path
                                    d="M8 1a2 2 0 0 1 2 2v2H6V3a2 2 0 0 1 2-2m3 4V3a3 3 0 1 0-6 0v2H3.36a1.5 1.5 0 0 0-1.483 1.277L.85 13.13A2.5 2.5 0 0 0 3.322 16h9.355a2.5 2.5 0 0 0 2.473-2.87l-1.028-6.853A1.5 1.5 0 0 0 12.64 5zm-1 1v1.5a.5.5 0 0 0 1 0V6h1.639a.5.5 0 0 1 .494.426l1.028 6.851A1.5 1.5 0 0 1 12.678 15H3.322a1.5 1.5 0 0 1-1.483-1.723l1.028-6.851A.5.5 0 0 1 3.36 6H5v1.5a.5.5 0 1 0 1 0V6z"/>
                            </svg>
                        </li>

                    </ul>
                </div>
                <div className='banner'></div>
            </header>

        // <header className="p-3 text-bg-dark">
        //     <div className="container">
        //         <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start"><a
        //             href="/" className="d-flex align-items-center mb-2 mb-lg-0 text-white text-decoration-none">
        //             {/*<svg className="bi me-2" width="40" height="32" role="img" aria-label="Bootstrap">*/}
        //             {/*    <use xlink:href="#bootstrap"></use>*/}
        //             {/*</svg>*/}
        //         </a>
        //             <ul className="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0">
        //                 <li><a href="#" className="nav-link px-2 text-secondary">Home</a></li>
        //                 <li><a href="#" className="nav-link px-2 text-white">Features</a></li>
        //                 <li><a href="#" className="nav-link px-2 text-white">Pricing</a></li>
        //                 <li><a href="#" className="nav-link px-2 text-white">FAQs</a></li>
        //                 <li><a href="#" className="nav-link px-2 text-white">About</a></li>
        //             </ul>
        //             <form className="col-12 col-lg-auto mb-3 mb-lg-0 me-lg-3" role="search"><input type="search"
        //                                                                                            className="form-control form-control-dark text-bg-dark"
        //                                                                                            placeholder="Search..."
        //                                                                                            aria-label="Search"/>
        //             </form>
        //             <div className="text-end">
        //                 <button type="button" className="btn btn-outline-light me-2">Login</button>
        //                 <button type="button" className="btn btn-warning">Sign-up</button>
        //             </div>
        //         </div>
        //     </div>
        // </header>

    )
}