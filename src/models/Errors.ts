import httpStatus from '~/constants/httpStatus';
import { userMessages } from '~/constants/messages';

/* type Error ở đây là
  {
    [key: string] : {
      msg: string,
      [key: string]: any
    }
  }
 */
type ErrorsType = Record<
    string,
    {
        msg: string;
        [key: string]: any;
    }
>;

export class ErrorWithStatus {
    message: string;
    status: number;
    constructor({ message, status }: { message: string; status: number }) {
        (this.message = message), (this.status = status);
    }
}
/* instance từ class EntityError có dạng là
  {
    message?: string,
    status: number,
    error: ErrorsType
  }
 */
export class EntityError extends ErrorWithStatus {
    errors: ErrorsType;
    constructor({
        message = userMessages.VALIDATION_ERROR,
        errors,
    }: {
        message?: string;
        errors: ErrorsType;
    }) {
        super({ message, status: httpStatus.UNPROCESSABLE_ENTITY });
        this.errors = errors;
    }
}
