import React, { useEffect, useState } from "react";
import { categoryService } from "../api/categories";
import '../index.css';
import { ChevronRight } from "react-feather";

export default function NavBar() {
    const [parentCategories, setParentCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredCategory, setHoveredCategory] = useState(null);
    const [loadedChildren, setLoadedChildren] = useState({});

    // Загрузка родительских категорий при монтировании
    useEffect(() => {
        const fetchParentCategories = async () => {
            try {
                const response = await categoryService.getAllParentCategories();
                setParentCategories(response.data);
                setLoading(false);
            } catch (err) {
                setError(err);
                setLoading(false);
                console.error("Ошибка загрузки категорий:", err);
            }
        };

        fetchParentCategories();
    }, []);

    // Загрузка подкатегорий при наведении
    const handleCategoryHover = async (categoryId) => {
        setHoveredCategory(categoryId);

        // Если подкатегории еще не загружены
        if (!loadedChildren[categoryId]) {
            try {
                const response = await categoryService.getChildCategories(categoryId);
                setParentCategories(prev =>
                    prev.map(category =>
                        category.id === categoryId
                            ? { ...category, children: response.data }
                            : category
                    )
                );
                setLoadedChildren(prev => ({ ...prev, [categoryId]: true }));

                // Предзагрузка подкатегорий второго уровня
                await Promise.all(
                    response.data.map(async subcategory => {
                        const subResponse = await categoryService.getChildCategories(subcategory.id);
                        setParentCategories(prev =>
                            prev.map(category => {
                                if (category.id === categoryId) {
                                    return {
                                        ...category,
                                        children: category.children?.map(child =>
                                            child.id === subcategory.id
                                                ? { ...child, children: subResponse.data }
                                                : child
                                        )
                                    };
                                }
                                return category;
                            })
                        );
                    })
                );
            } catch (err) {
                console.error("Ошибка загрузки подкатегорий:", err);
            }
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">Ошибка загрузки меню</div>;

    return (
        <nav className="navbar-container">
            <div className="dropdown-menu">
                <ul className="categories">
                    {parentCategories.map(category => (
                        <li
                            key={category.id}
                            className="category"
                            onMouseEnter={() => handleCategoryHover(category.id)}
                            onMouseLeave={() => setHoveredCategory(null)}
                        >
                            <a
                                href={`/category/${category.slug}`}
                                className="category-link"
                            >
                                {category.name}
                                {category.children?.length > 0 && (
                                    <span className="has-children">
                                    <ChevronRight size={16}/>
                                </span>
                                )}
                            </a>

                            {category.children && hoveredCategory === category.id && (
                                <div className="subcategories-container">
                                    <ul className="subcategories-level1">
                                        {category.children.map(subcategory1 => (
                                            <li key={subcategory1.id} className="subcategory1-item">
                                                <div className="subcategory1-header">
                                                    <a href={`/category/${subcategory1.slug}`}
                                                       className="subcategory1-link">
                                                        {subcategory1.name}
                                                    </a>
                                                    {subcategory1.children?.length > 0 && (
                                                        <span className="has-children">
                                                        <ChevronRight size={14}/>
                                                    </span>
                                                    )}
                                                </div>

                                                {subcategory1.children?.length > 0 && (
                                                    <ul className="subcategories-level2">
                                                        {subcategory1.children.map(subcategory2 => (
                                                            <li key={subcategory2.id}>
                                                                <a href={`/category/${subcategory2.slug}`}>
                                                                    {subcategory2.name}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

        </nav>
    );
}