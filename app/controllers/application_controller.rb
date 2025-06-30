# frozen_string_literal: true

class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery(with: :exception)
  rescue_from(StandardError, with: :render_server_error) if Rails.env.production?
  add_flash_types(:info, :warning)
  impersonates(:user)
  helper_method(:company_admin_page?)

  before_action(unless: :skip_subdomain_authorization?) do
    if unauthorized_subdomain?
      redirect_to(
        if current_user.company.blank?
          new_company_url(subdomain: '')
        else
          root_url(subdomain: current_user.company.subdomain)
        end
      )
    end
  end
  before_action(if: %i[company_admin_page? impersonating_user?]) do
    flash.now[:warning] = "Impersonating user: #{current_user.full_name}"
  end

  def auth_test
    respond_to do |format|
      format.any do # zapier sends GET request with Accept = */* (any format permissable)
        render({
                 # content_type: 'application/json',  # not necessary
                 json: { user: { email: current_user.email, company_id: current_user.company_id } },
                 status: 200
               })
      end
    end
  end

  protected

  def set_company
    @company = Company.find_by(id: params[:company_id]) ||
               Company.where('subdomain = ? OR subdomain = ?', params[:company_id], request.subdomain).take ||
               current_user&.company
  end

  def story_filters_from_params(company, is_dashboard: false)
    params.permit(params.keys).to_h.filter_map do |param, value|
      next unless param.in? %w[curator status customer category product]

      if is_dashboard
        [param.to_sym, value&.to_i]
      elsif param == 'category'
        category_tag = company.categories.where(slug: value).take
        [param.to_sym, category_tag.id] if category_tag
      elsif param == 'product'
        product_tag = company.products.where(slug: value).take
        [param.to_sym, product_tag.id] if product_tag
      end
    end.to_h
  end

  def after_sign_in_path_for(current_resource)
    if session[:user_return_to].present?
      session[:user_return_to]
    elsif current_resource.is_a? User
      if current_resource.company.present?
        dashboard_url('curate', subdomain: current_resource.company.subdomain)
      else
        edit_csp_user_registration_path
      end
    elsif current_resource.is_a? Admin
      rails_admin_path
    end
  end

  def after_sign_out_path_for(_resource)
    if request.subdomain.present?
      if @not_authorized_for_subdomain
        new_csp_user_session_url(subdomain: '')
      else
        root_url(subdomain: request.subdomain)
      end
    else
      new_csp_user_session_url(subdomain: '')
    end
  end

  private

  def render_server_error
    render 'application/500_server_error', status: :internal_server_error, layout: false
  end

  def skip_subdomain_authorization?
    !user_signed_in? or
      signing_in_or_out? or # users/sessions#create will handle subdomain authorization independently
      public_page? or
      turbo_frame_request? or
      request.subdomain == DEV_TUNNEL_SUBDOMAIN or
      controller_name == 'plugins' or
      action_name == 'not_found'
  end

  def signing_in_or_out?
    controller_name == 'sessions' and action_name.in? %w[create destroy]
  end

  def public_page?
    controller_name == 'stories' and action_name.in? %w[index show] or controller_name == 'contributions'
  end

  def company_admin_page?
    controller_name == 'companies' && action_name.in?(%w[new show edit]) or
      controller_name == 'registrations' && action_name.in?(%w[edit update]) or
      controller_name == 'stories' && action_name == 'edit'
  end

  def impersonating_user?
    user_signed_in? and current_user != true_user
  end

  def unauthorized_subdomain?
    session['authorized_subdomains']&.exclude?(request.subdomain)
  end
end
