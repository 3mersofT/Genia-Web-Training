import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRateLimiter } from '@/lib/rate-limiter';
import { CreateNotificationSchema, UpdateNotificationSchema } from '@/lib/validations/notifications.schema';

// Rate limiter: 30 requests per minute
const rateLimiter = createRateLimiter({
  interval: 60000,
  limit: 30,
});

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const { response: rateLimitResponse } = await rateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Paramètres de requête
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construire la requête
    let query = supabase
      .from('student_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtres optionnels
    if (type) {
      query = query.eq('type', type);
    }

    if (isRead !== null && isRead !== undefined) {
      query = query.eq('is_read', isRead === 'true');
    }

    const { data: notifications, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des notifications' },
        { status: 500 }
      );
    }

    // Récupérer le nombre total de notifications non lues
    const { count: unreadCount } = await supabase
      .from('student_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    return NextResponse.json({
      notifications,
      unreadCount: unreadCount || 0
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const { response: rateLimitResponse } = await rateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validation with Zod
    const validationResult = CreateNotificationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const {
      type,
      title,
      message,
      data
    } = validationResult.data;

    // Insérer la notification
    const { data: notification, error } = await supabase
      .from('student_notifications')
      .insert({
        user_id: user.id,
        type,
        title,
        message,
        data: data || {}
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Erreur lors de la création de la notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  // Apply rate limiting
  const { response: rateLimitResponse } = await rateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validation with Zod
    const validationResult = UpdateNotificationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { notificationId, markAllAsRead } = validationResult.data;

    // Marquer toutes les notifications comme lues
    if (markAllAsRead) {
      const { error } = await supabase
        .from('student_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour des notifications' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Toutes les notifications ont été marquées comme lues'
      });
    }

    // Marquer une notification spécifique comme lue
    const { data: notification, error } = await supabase
      .from('student_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la notification' },
        { status: 500 }
      );
    }

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
