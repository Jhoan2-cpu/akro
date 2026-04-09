<?php

declare(strict_types=1);

namespace App\Http\Requests\Users;

use App\Concerns\UserValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    use UserValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => $this->nameRules(),
            'email' => $this->emailRules(),
            'branch_id' => $this->branchRules(),
            'role' => $this->roleRules(),
            'status' => $this->statusRules(),
            'password' => $this->passwordRules(true),
        ];
    }
}