const { sequelize } = require('../db/models');
const { QueryTypes } = require('sequelize');

module.exports = class CourseService {
    static async getAll({ keyword, rating, categoryId }) {
        let nameQuery =
            keyword !== undefined ? `and c.name like "%${keyword}%"` : '';
        let ratingQuery = rating !== undefined ? ` rating >= ${rating} ` : '';
        let categoryQuery =
            categoryId !== undefined
                ? ` categoryId = ${categoryId}`
                : '';

        let and =
            rating !== undefined && categoryId !== undefined ? ` and ` : ' ';
        let having =
            rating !== undefined || categoryId !== undefined
                ? `having `
                : ' ';
        let query = `select c.id as courseId, c.name, c.description, c.categoryId, ca.name as categoryName,
        c.instructorId, concat(u.firstName," ", u.lastName) as instructorName,
        u.email as instructorEmail, round(avg(uc.rating),1) as rating,
        c.imageUrl,
        count(uc.id) as register
        from courses c
        JOIN categories ca on ca.id = c.categoryId 
        left join usercourses uc on uc.courseId = c.id 
        left join users u on u.id = c.instructorId
        where c.verified = 1 
        ${nameQuery} group by c.id
        ${having} ${ratingQuery} ${and} ${categoryQuery}`;

        try {
            const response = await sequelize.query(query, {
                replacements: [],
                type: QueryTypes.SELECT,
            });

            return response;
        } catch (error) {
            console.log(error);
        }
    }
    static async getInstructorCourses(userId) {
        try {
            const response = await sequelize.query(
                `select c.id,c.categoryId,c.name,c.description,ca.name as categoryName,c.imageUrl,c.verified,DATE_FORMAT(c.dateAdded, "%h:%i:%s' %d/%m/%Y") as dateAdded from courses c
                join categories ca on c.categoryId = ca.id where c.instructorId = ?;`,
                {
                    replacements: [userId],
                    type: QueryTypes.SELECT,
                },
            );
            return response;
        } catch (error) {
            console.log(error);
        }
    }
};


