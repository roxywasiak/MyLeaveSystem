import { UserController } from '../controllers/UserController';
import { User } from '../entity/User';
import { Role } from '../entity/Role';
import { Repository } from 'typeorm';
import { StatusCodes } from 'http-status-codes';
import { ResponseHandler } from '../helper/ResponseHandler';
import { Request, Response } from 'express';
import * as classValidator from "class-validator";
import * as classTransformer from "class-transformer";
import { mock, MockProxy } from "jest-mock-extended"; 

const VALIDATOR_CONSTRAINT_PASSWORD_AT_LEAST_10_CHARS = 'Password must be at least 10 characters long';

jest.mock('../helper/ResponseHandler');

jest.mock('class-validator', () => ({
    ...jest.requireActual('class-validator'),
    validate: jest.fn(), 
}));

jest.mock("class-transformer", () => ({
    ...jest.requireActual("class-transformer"),
    instanceToPlain: jest.fn(),
}));

describe('UserController', () => {
    function getValidManagerData() : User {
            let role = new Role();
            role.id = 1;
            role.name = 'manager';

            let user = new User();
            user.id = 1;
            user.password = 'a'.repeat(10);
            user.email = 'manager@email.com';
            user.role = role;
            return user;
    }

    function getValidStaffData() : User {
        let role = new Role();
        role.id = 2;
        role.name = 'staff';

        let user = new User();
        user.id = 1;
        user.password = 'b'.repeat(10);
        user.email = 'staff@email.com';
        user.role = role;
        return user;
    }

    const mockRequest = (params = {}, body = {}): Partial<Request> => ({
        params,
        body,
    });

    const mockResponse = (): Partial<Response> => ({});

    let userController: UserController;
    let mockUserRepository: jest.Mocked<Repository<User>>;

    beforeEach(() => {
        mockUserRepository = mock() as jest.Mocked<Repository<User>>;

        // Inject the mocked repository into UserController
        userController = new UserController();
        userController['userRepository'] = mockUserRepository as Repository<User>;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });


//getAll test for NO_CONTENT - same as RoleController test version

//getAll test INTERNAL_SERVER_ERROR - same as RoleController test version

    it('getAll will return all users', async () => {
        const mockUsers: User[] = [getValidManagerData(), getValidStaffData()];
        const req = mockRequest();
        const res = mockResponse();

        mockUserRepository.find.mockResolvedValue(mockUsers);

        await userController.getAll(req as Request, res as Response);
    
        expect(mockUserRepository.find).toHaveBeenCalledWith({ relations: ['role'] });
        expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(res, mockUsers);
    });

    it('create will return BAD_REQUEST if no user password was provided', async () => {
        const validManagerDetails = getValidManagerData();
        const req = mockRequest({}, { email: validManagerDetails.email, 
                                        roleId: validManagerDetails.role.id }); 
        const res = mockResponse();
    
        //controller validate returns Password must be at least 10 characters long
        const EXPECTED_ERROR_MESSAGE = VALIDATOR_CONSTRAINT_PASSWORD_AT_LEAST_10_CHARS;
        jest.spyOn(classValidator, 'validate').mockResolvedValue([
            {
                property: 'password',
                constraints: {
                    //IsString: VALIDATOR_CONSTRAINT_PASSWORD_MUST_BE_A_STRING, 
                    MinLength: VALIDATOR_CONSTRAINT_PASSWORD_AT_LEAST_10_CHARS,
                },
            },
        ]);

        await userController.create(req as Request, res as Response);
        expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(res, 
                                                                        StatusCodes.BAD_REQUEST, 
                                                                        EXPECTED_ERROR_MESSAGE);
    });

//Follow same approach as above for email
//Follow same approach for missing role i

    it('Create will return a valid user and return CREATED status when supplied with valid details', async () => {
        const validManagerDetails= getValidManagerData();

        const req = mockRequest({}, { password: validManagerDetails.password, 
                                        email: validManagerDetails.email, 
                                        roleId: validManagerDetails.role.id }); //roleId is expected in body 
        const res = mockResponse();

        mockUserRepository.save.mockResolvedValue(validManagerDetails);

        jest.spyOn(classTransformer, "instanceToPlain").mockReturnValue({
            id: validManagerDetails.id,
            email: validManagerDetails.email,
            role: { id: validManagerDetails.role.id, 
                    name: validManagerDetails.role.name },
        } as any);

        jest.spyOn(classValidator, 'validate').mockResolvedValue([]);

        await userController.create(req as Request, res as Response);

        expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining({ password: validManagerDetails.password, 
                                                                                        email: validManagerDetails.email, 
                                                                                        role: validManagerDetails.role.id }));//role not roleId
        
                                                                                        
        expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(res, 
                                                                        //will now have an id
                                                                        //instanceToPlain should remove password (even if we didn't use a spy)
                                                                        {   id: validManagerDetails.id, 
                                                                            email: validManagerDetails.email, 
                                                                            role: validManagerDetails.role },
                                                                            StatusCodes.CREATED);
    });

//add delete tests

    it('update returns a BAD_REQUEST if no id is provided', async () => {
        const req = mockRequest(); //Invalid/no id
        const res = mockResponse();
    
        await userController.update(req as Request, res as Response);
    
        expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(res, 
                                                                    StatusCodes.BAD_REQUEST, 
                                                                    UserController.ERROR_NO_USER_ID_PROVIDED);
    });

//add additional update tests
});
