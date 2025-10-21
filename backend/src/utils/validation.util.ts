import Joi from 'joi';

export const loginSchema = Joi.object({
  identifier: Joi.string().required().messages({
    'string.empty': 'Email hoặc tên người dùng không được để trống',
    'any.required': 'Email hoặc tên người dùng là bắt buộc'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Mật khẩu không được để trống',
    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
    'any.required': 'Mật khẩu là bắt buộc'
  })
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'string.empty': 'Email không được để trống',
    'any.required': 'Email là bắt buộc'
  }),
  username: Joi.string().min(3).max(30).alphanum().required().messages({
    'string.min': 'Tên người dùng phải có ít nhất 3 ký tự',
    'string.max': 'Tên người dùng không được quá 30 ký tự',
    'string.alphanum': 'Tên người dùng chỉ được chứa chữ cái và số',
    'string.empty': 'Tên người dùng không được để trống',
    'any.required': 'Tên người dùng là bắt buộc'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
    'string.empty': 'Mật khẩu không được để trống',
    'any.required': 'Mật khẩu là bắt buộc'
  })
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'string.empty': 'Email không được để trống',
    'any.required': 'Email là bắt buộc'
  })
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Token không được để trống',
    'any.required': 'Token là bắt buộc'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
    'string.empty': 'Mật khẩu không được để trống',
    'any.required': 'Mật khẩu là bắt buộc'
  })
});


export const validateRequest = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    throw new Error(errorMessages.join(', '));
  }
  
  return value;
};
