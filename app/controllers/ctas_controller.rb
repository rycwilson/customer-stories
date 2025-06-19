class CtasController < ApplicationController
  before_action(except: :show) { @company = Company.find(params[:company_id]) }

  def new
    @cta = @company.ctas.new(primary: params[:primary].present?)
  end

  # return html for cta forms
  def show
    @form = CtaForm.find(params[:id])
    render layout: false
  end

  def create
    # update_company allows for an atomic update of a company's primary cta, can be re-used here
    update_company(@company, cta_params)
    respond_to do |format|
      format.turbo_stream do 
        render(
          turbo_stream: turbo_stream.replace('company-ctas', partial: 'companies/settings/ctas', locals: { company: @company })
        )
      end
    end
  end

  def update
    cta = CallToAction.find(params[:id])
    _cta_params = cta_params(cta)
    if primary_replacement?(@company, _cta_params)
      update_company(@company, _cta_params.merge(id: cta.id))
    else 
      cta.update(_cta_params)
      @company.reload if _cta_params[:company_attributes].present?
    end
    render(partial: 'companies/settings/ctas', locals: { company: @company })
  end

  def destroy
    CallToAction.find(params[:id])&.destroy
    flash.now[:notice] = 'CTA was deleted'
    render(partial: 'companies/settings/ctas', locals: { company: @company })
  end

  private

  def cta_params(cta = nil)
    params
      .require(cta ? "cta_#{cta.id}" : :cta)
      .permit(
        :type,
        :description, 
        :display_text, 
        :link_url, 
        :form_html, 
        :primary, 
        company_attributes: [:id, :primary_cta_background_color, :primary_cta_text_color]
      )
  end

  # swap primary ctas in a single transaction to ensure there is always only one primary cta
  def update_company(company, _cta_params)
    prev_primary_cta = primary_replacement?(company, _cta_params) ? 
      company.ctas.primary.attributes.merge('primary' => false) : 
      nil 
    company_params = { 
      ctas_attributes: [_cta_params.reject { |k, v| k == 'company_attributes' }, prev_primary_cta].compact 
    }
    company.update(company_params.merge(_cta_params[:company_attributes] || {}))
  end

  def primary_replacement?(company, _cta_params)
    company.ctas.primary.present? && _cta_params[:primary] == 'true'
  end

end