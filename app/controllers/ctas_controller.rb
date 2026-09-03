# frozen_string_literal: true

class CtasController < ApplicationController
  before_action(:set_company, except: :show)

  def new
    @cta = @company.ctas.build type: 'CtaLink', primary: params[:primary].present?
  end

  # return html for cta forms
  def show
    @form = CtaForm.find params[:id]
    render layout: false
  end

  def create
    if @company.update company_params
      respond_to do |format|
        format.turbo_stream do
          flash.now[:notice] = 'CTA created successfully'
          render( 
            turbo_stream: [
              turbo_stream.replace('toaster', partial: 'shared/toaster'),
              turbo_stream.update(
                'company-ctas-frame', partial: 'companies/ctas', locals: { company: @company }
              )
            ],
            status: :created
          )
        end
      end
    else
      @errors = @company.errors.full_messages
      respond_to do |format|
        format.turbo_stream do
          # render turbo_stream:
          #   turbo_stream.update(
          #     'company-ctas-frame', partial: 'companies/ctas', locals: { company: @company }
          #   )
        end
      end
    end
    # respond_to do |format|
    # end
  end

  def update
    if @company.update company_params
      respond_to do |format|
        format.turbo_stream do
          flash.now[:notice] = 'CTA has been updated'
          render turbo_stream: [
            turbo_stream.replace('toaster', partial: 'shared/toaster'),
            turbo_stream.update(
              'company-ctas-frame', partial: 'companies/ctas', locals: { company: @company }
            )
          ]
        end
      end
    else 
      @errors = @company.errors.full_messages
      # TODO: render companies/ctas with current cta open
    end
  end

  def destroy
    CallToAction.find(params[:id])&.destroy
    respond_to do |format| 
      format.html { head(:no_content) }
      format.turbo_stream do
        flash.now[:info] = 'CTA was deleted'
        render turbo_stream: [
          turbo_stream.replace('toaster', partial: 'shared/toaster'),
          turbo_stream.update(
            'company-ctas-frame', partial: 'companies/ctas', locals: { company: @company }
          )
        ]
      end
    end
  end

  private

  def company_params
    params
      .require(:company)
      .permit(
        :primary_cta_background_color,
        :primary_cta_text_color,
        ctas_attributes: [:id, :type, :description, :display_text, :link_url, :form_html, :primary]
      )
  end
end
