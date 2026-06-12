import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user to check multi-tenancy
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { invoice_id } = await req.json();

    if (!invoice_id) {
      return new Response(JSON.stringify({ error: 'Missing invoice_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch the invoice to ensure it exists and belongs to the user's company
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('accounting_invoices')
      .select('*, company_id')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found or no permission');
    }

    if (invoice.invoice_type !== 'SALE' || invoice.status !== 'APPROVED') {
      throw new Error('Only APPROVED SALE invoices can be issued as E-Invoice');
    }

    // 2. Fetch the company's E-Invoice settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('accounting_settings')
      .select('einvoice_provider, einvoice_api_url, einvoice_username, einvoice_password, einvoice_template_code, einvoice_series')
      .eq('company_id', invoice.company_id)
      .single();

    if (settingsError || !settings || !settings.einvoice_provider) {
      throw new Error('E-Invoice settings not configured for this company');
    }

    // 3. MOCK API CALL TO PROVIDER
    console.log(`Sending E-Invoice data to ${settings.einvoice_provider}...`);
    // In reality, this would be a fetch() call to settings.einvoice_api_url
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate successful response from tax authority
    const mockTaxCode = `CQT-${Math.floor(Math.random() * 1000000000)}`;
    const mockPdfUrl = `https://mock-einvoice-provider.com/download/pdf/${invoice_id}`;
    const mockXmlUrl = `https://mock-einvoice-provider.com/download/xml/${invoice_id}`;

    // 4. Update the invoice status
    const { error: updateError } = await supabaseClient
      .from('accounting_invoices')
      .update({
        einvoice_status: 'ISSUED',
        einvoice_transaction_id: `TXN-${Math.floor(Math.random() * 1000000)}`,
        einvoice_tax_code: mockTaxCode,
        einvoice_pdf_url: mockPdfUrl,
        einvoice_xml_url: mockXmlUrl,
      })
      .eq('id', invoice_id);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'E-Invoice issued successfully',
      tax_code: mockTaxCode,
      pdf_url: mockPdfUrl
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('E-Invoice Issue Error:', error);
    
    // Attempt to mark as failed if we have the invoice_id from the request body
    try {
      const clonedReq = req.clone();
      const { invoice_id } = await clonedReq.json();
      if (invoice_id) {
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        await supabaseAdmin
          .from('accounting_invoices')
          .update({ einvoice_status: 'FAILED' })
          .eq('id', invoice_id);
      }
    } catch (_) {
      // Ignore inner errors
    }

    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
