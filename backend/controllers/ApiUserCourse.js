const { pagination } = require('../utils/feature');
const {
    User,
    Course,
    Category,
    UserCourse,
    Notification,
} = require('../db/models');
const UserCourseService = require('../dbService/userCourseService');

module.exports = class ApiCourse {
    // @route   GET api/userCourse/enroll/:courseId
    // @desc    check enroll a course by student
    // @access  private
    static async checkEnrollCourse(req, res, next) {
        let courseId = req.params.courseId;
        let studentId = req.user.id;
        try {
            let course = await Course.findOne({ where: { id: courseId } });

            if (!course || !course.verified) {
                return res.status(400).json({
                    error: true,
                    msg: ['Bạn không thể đăng kí khoá học này'],
                });
            }

            let notification = await Notification.findOne({
                where: { courseId: courseId, senderId: studentId },
            });
            if (notification) {
                return res.status(400).json({
                    error: true,
                    msg: ['Bạn đã đăng kí, chờ giảng viên của bản chấp thuận!'],
                });
            } else {
                req.instructorId = course.instructorId;
                let { url } = req;

                if (url.includes('/enroll/check/')) {
                    return res.status(200).json({
                        error: false,
                        msg: ['oke'],
                    });
                } else {
                    next();
                }
            }
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Server error');
        }
    }
    // @route   GET api/userCourse/:courseId
    // @desc    check enroll a course
    // @access  private
    static async checkCourse(req, res, next) {
        let courseId = req.params.courseId;
        let userId = req.user.id;
        try {
            let course = await Course.findOne({ where: { id: courseId } });

            if (!course || !course.verified) {
                return res.status(400).json({
                    error: true,
                    msg: ['Bạn không thể đăng kí khoá học này'],
                });
            }

            let userCourse = await UserCourse.findOne({
                where: { courseId: courseId, userId: userId },
            });
            if (userCourse || course.instructorId == userId) {
                return res.status(200).json({
                    error: false,
                    msg: ['oke!'],
                });
            } else {
                return res.status(400).json({
                    error: true,
                    msg: ['Bạn phải đăng kí khoá học này trước đã'],
                });
            }
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Server error');
        }
    }

    // @route   GET api/userCourse/enroll/:courseId
    // @desc    enroll a course by student
    // @access  private
    static async enroll(req, res) {
        let instructorId = req.instructorId;
        let { courseId} = req.params;
        let studentId = req.user.id;
        try {
            let user = await User.findOne({ where: { id: studentId } });

            let topic = 'Đăng ký khoá học';
            let details = `${user.email} vừa đăng kí khoá học của bạn`;

            let notification = {
                courseId: courseId,
                senderId: studentId,
                topic,
                details,
            };

            await Notification.create(notification).then((notification) => {
                return res.status(200).json({
                    error: false,
                    msg: 'Đã thông báo đến giáo viên, xin vui lòng chờ giáo viên của bạn chấp nhận',
                });
            });
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Server error');
        }
    }

    // @route   POST api/userCourse/rate/:courseId
    // @desc    rate the course
    // @access  private
    static async rate(req, res) {
        let rating = parseInt(req.params.rating);
        let courseId = parseInt(req.params.courseId);
        let userId = req.user.id;
        
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                error: true,
                msg: 'Bạn phải đánh giá khoá học từ 1 - 5',
            });
        }
     
        try {
            let userCourse = await UserCourse.findOne({
                where: { courseId: courseId, userId },
            });
           
            if (userCourse.rating == rating) {
                return res.status(400).json({
                    error: true,
                    msg: ['Đánh giá khoá học chưa được thay đổi'],
                });
            } else {
                userCourse.rating = `${rating}`;
                
                await userCourse.save();
                return res.status(200).json({
                    error: false,
                    rating: rating,
                    msg: 'Bạn đã đánh giá khoá học',
                });
            }
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Server error');
        }
    }

    // @route   Get api/userCourse/all
    // @desc    get the list of user courses
    // @access  private
    static async getAll(req, res) {
        try {
            let { page } = req.query;
            let { id } = req.user;

            let userCourse = await UserCourseService.getUserCourses(id);

            let courses = pagination(userCourse, page);

            for (let i in courses) {
                if(courses[i].imageUrl) {
                    courses[i].imageUrl = courses[i].imageUrl.split(" ")[0];
                }
            }

            res.status(200).json({
                error: false,
                courses: courses,
                filteredCourse: courses.length,
                totalCourse: userCourse.length,
            });
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Server error');
        }
    }
};
