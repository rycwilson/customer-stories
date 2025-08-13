# frozen_string_literal: true

class CtasController < ApplicationController
  before_action(:set_company, except: :show)

  def new
    @cta = @company.ctas.new(primary: params[:primary].present?)
  end

  # return html for cta forms
  def show
    @form = CtaForm.find(params[:id])
    render layout: false
  end

  def create
    update_company(@company)
    respond_to do |format|
      format.turbo_stream do
        render turbo_stream:
          turbo_stream.replace(
            'company-ctas', partial: 'companies/settings/ctas', locals: { company: @company }
          )
      end
    end
  end

  def update
    @cta = CallToAction.find params[:id]
    if primary_replacement? @company
      update_company(@company)
      flash.now[:notice] = 'Primary CTA was changed'
    else
      @cta.update cta_params
      @company.reload if cta_params[:company_attributes].present? # if primary cta colors changed
      flash.now[:notice] = 'CTA was updated'
    end
    render(partial: 'companies/settings/ctas', locals: { company: @company })
  end

  def destroy
    CallToAction.find(params[:id])&.destroy
    flash.now[:notice] = 'CTA was deleted'
    render(partial: 'companies/settings/ctas', locals: { company: @company })
  end

  private

  def cta_params
    params
      .require(@cta ? "cta_#{@cta.id}" : :cta)
      .permit(
        :type, :description, :display_text, :link_url, :form_html, :primary,
        company_attributes: %i[id primary_cta_background_color primary_cta_text_color]
      )
  end

  # Swap primary ctas in a single transaction
  def update_company(company)
    cta = @cta ? cta_params.merge(id: @cta.id) : cta_params
    prev_primary_cta = if primary_replacement?(company)
                         company.ctas.primary.take.attributes.merge('primary' => false)
                       end
    company_params = {
      ctas_attributes: [cta.reject { |k, _| k == 'company_attributes' }, prev_primary_cta].compact
    }
    company.update company_params.merge(cta[:company_attributes] || {})
  end

  def primary_replacement?(company)
    company.ctas.primary.present? && cta_params[:primary] == 'true'
  end
end
